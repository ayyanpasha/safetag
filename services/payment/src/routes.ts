import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../generated/prisma/index.js';
import {
  createLogger,
  handleError,
  NotFoundError,
  ValidationError,
  publishEvent,
} from '@safetag/service-utils';
import {
  PlanType,
  PLAN_DETAILS,
  EVENTS,
} from '@safetag/shared-types';
import { z } from 'zod';
import { createSubscription, verifyWebhookSignature } from './services/razorpay.js';

const prisma = new PrismaClient();
const logger = createLogger('payment-routes');

// ─── Schemas ──────────────────────────────────────────────

const SubscribeSchema = z.object({
  plan: PlanType,
});

// ─── Helpers ──────────────────────────────────────────────

function getPeriodEnd(plan: z.infer<typeof PlanType>): Date {
  const now = new Date();
  const months = PLAN_DETAILS[plan].duration;
  return new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
}

// ─── Route Registration ───────────────────────────────────

export function registerRoutes(app: FastifyInstance): void {
  // GET /api/payments/plans — return plan details
  app.get('/api/payments/plans', async (_request, reply) => {
    return reply.send({
      success: true,
      data: PLAN_DETAILS,
    });
  });

  // GET /api/payments/subscription — get current user's subscription
  app.get('/api/payments/subscription', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        const { statusCode, body } = handleError(new ValidationError('Missing x-user-id header'));
        return reply.code(statusCode).send(body);
      }

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: { payments: { orderBy: { createdAt: 'desc' }, take: 10 } },
      });

      if (!subscription) {
        return reply.send({ success: true, data: null });
      }

      return reply.send({ success: true, data: subscription });
    } catch (err) {
      logger.error({ err }, 'Failed to get subscription');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // POST /api/payments/subscribe — create a new subscription
  app.post('/api/payments/subscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.headers['x-user-id'] as string;
      const userPhone = request.headers['x-user-phone'] as string;
      if (!userId) {
        const { statusCode, body } = handleError(new ValidationError('Missing x-user-id header'));
        return reply.code(statusCode).send(body);
      }

      const parsed = SubscribeSchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError(parsed.error.errors[0].message));
        return reply.code(statusCode).send(body);
      }

      const { plan } = parsed.data;
      const planDetails = PLAN_DETAILS[plan];

      // Check for existing active subscription
      const existing = await prisma.subscription.findUnique({ where: { userId } });
      if (existing && (existing.status === 'ACTIVE' || existing.status === 'TRIALING')) {
        return reply.code(400).send({
          success: false,
          error: 'You already have an active subscription',
        });
      }

      // Create Razorpay subscription
      const { subscriptionId, shortUrl } = await createSubscription(
        plan,
        userId,
        userPhone || '',
      );

      const now = new Date();
      const periodEnd = getPeriodEnd(plan);

      // Upsert local subscription record
      const subscription = await prisma.subscription.upsert({
        where: { userId },
        update: {
          plan,
          status: 'TRIALING',
          razorpaySubId: subscriptionId,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          vehicleLimit: planDetails.vehicleLimit,
        },
        create: {
          userId,
          plan,
          status: 'TRIALING',
          razorpaySubId: subscriptionId,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          vehicleLimit: planDetails.vehicleLimit,
        },
      });

      logger.info({ userId, plan, subscriptionId }, 'Subscription created');

      return reply.send({
        success: true,
        data: {
          subscription,
          shortUrl,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to create subscription');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // POST /api/payments/webhook — Razorpay webhook handler
  app.post('/api/payments/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const signature = request.headers['x-razorpay-signature'] as string;
      if (!signature) {
        return reply.code(400).send({ success: false, error: 'Missing signature' });
      }

      const rawBody = (request as any).rawBody || JSON.stringify(request.body);

      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        logger.warn('Invalid webhook signature');
        return reply.code(400).send({ success: false, error: 'Invalid signature' });
      }

      const event = request.body as any;
      const eventType: string = event.event;

      logger.info({ eventType }, 'Webhook received');

      switch (eventType) {
        case 'subscription.activated': {
          const subEntity = event.payload.subscription.entity;
          const razorpaySubId = subEntity.id;
          const subscription = await prisma.subscription.findUnique({
            where: { razorpaySubId },
          });
          if (subscription) {
            await prisma.subscription.update({
              where: { razorpaySubId },
              data: {
                status: 'ACTIVE',
                razorpayCustomerId: subEntity.customer_id || null,
              },
            });
            await publishEvent(EVENTS.SUBSCRIPTION_ACTIVATED, {
              userId: subscription.userId,
              plan: subscription.plan,
              vehicleLimit: subscription.vehicleLimit,
            });
            logger.info({ razorpaySubId }, 'Subscription activated');
          }
          break;
        }

        case 'subscription.charged': {
          const subEntity = event.payload.subscription.entity;
          const paymentEntity = event.payload.payment.entity;
          const razorpaySubId = subEntity.id;
          const subscription = await prisma.subscription.findUnique({
            where: { razorpaySubId },
          });
          if (subscription) {
            await prisma.payment.create({
              data: {
                subscriptionId: subscription.id,
                razorpayPaymentId: paymentEntity.id,
                razorpayOrderId: paymentEntity.order_id || '',
                amount: paymentEntity.amount,
                currency: paymentEntity.currency || 'INR',
                status: paymentEntity.status || 'captured',
              },
            });
            const periodEnd = getPeriodEnd(subscription.plan);
            await prisma.subscription.update({
              where: { razorpaySubId },
              data: {
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: periodEnd,
              },
            });
            logger.info({ razorpaySubId }, 'Subscription charged');
          }
          break;
        }

        case 'subscription.cancelled': {
          const subEntity = event.payload.subscription.entity;
          const razorpaySubId = subEntity.id;
          const subscription = await prisma.subscription.findUnique({
            where: { razorpaySubId },
          });
          if (subscription) {
            await prisma.subscription.update({
              where: { razorpaySubId },
              data: { status: 'CANCELED' },
            });
            await publishEvent(EVENTS.SUBSCRIPTION_CANCELED, {
              userId: subscription.userId,
            });
            logger.info({ razorpaySubId }, 'Subscription cancelled');
          }
          break;
        }

        case 'payment.captured': {
          const paymentEntity = event.payload.payment.entity;
          // Find subscription by notes if available
          const notes = paymentEntity.notes || {};
          if (notes.userId) {
            const subscription = await prisma.subscription.findUnique({
              where: { userId: notes.userId },
            });
            if (subscription) {
              await prisma.payment.upsert({
                where: { razorpayPaymentId: paymentEntity.id },
                update: { status: 'captured' },
                create: {
                  subscriptionId: subscription.id,
                  razorpayPaymentId: paymentEntity.id,
                  razorpayOrderId: paymentEntity.order_id || '',
                  amount: paymentEntity.amount,
                  currency: paymentEntity.currency || 'INR',
                  status: 'captured',
                },
              });
              logger.info({ paymentId: paymentEntity.id }, 'Payment captured');
            }
          }
          break;
        }

        default:
          logger.info({ eventType }, 'Unhandled webhook event');
      }

      return reply.send({ success: true });
    } catch (err) {
      logger.error({ err }, 'Webhook processing failed');
      return reply.code(500).send({ success: false, error: 'Webhook processing failed' });
    }
  });

  // ─── Internal Routes ────────────────────────────────────

  // GET /internal/payments/subscription/:userId
  app.get('/internal/payments/subscription/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        const { statusCode, body } = handleError(new NotFoundError('Subscription not found'));
        return reply.code(statusCode).send(body);
      }

      return reply.send({ success: true, data: subscription });
    } catch (err) {
      logger.error({ err }, 'Failed to get subscription (internal)');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });
}
