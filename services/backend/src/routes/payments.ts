import { FastifyInstance } from 'fastify';
import {
  getPlans,
  getUserSubscription,
  createSubscription,
  verifyWebhookSignature,
  processWebhookEvent,
  cancelSubscription,
  getPaymentHistory,
  getExtraVehiclePrice,
  createExtraVehicleOrder,
  verifyExtraVehiclePurchase,
  getVehiclePurchaseHistory,
  PlanType,
} from '../services/payment.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { createRouteRateLimit, RATE_LIMITS } from '../middleware/rate-limit.js';
import { subscribeSchema, SubscribeInput } from '../lib/validation.js';

async function paymentRoutes(app: FastifyInstance): Promise<void> {
  // Get available plans (public)
  app.get('/plans', async (_request, reply) => {
    const plans = getPlans();
    return reply.code(200).send({ plans });
  });

  // Get user's subscription (authenticated)
  app.get(
    '/subscription',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const subscription = await getUserSubscription(request.user!.userId);

      if (!subscription) {
        return reply.code(200).send({
          subscription: null,
          message: 'No active subscription',
        });
      }

      return reply.code(200).send({ subscription });
    }
  );

  // Create subscription (authenticated)
  app.post<{ Body: SubscribeInput }>(
    '/subscribe',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const body = subscribeSchema.parse(request.body);
      const result = await createSubscription(
        request.user!.userId,
        body.plan as PlanType
      );
      return reply.code(201).send(result);
    }
  );

  // Cancel subscription (authenticated)
  app.post(
    '/cancel',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      await cancelSubscription(request.user!.userId);
      return reply.code(200).send({
        success: true,
        message: 'Subscription cancelled',
      });
    }
  );

  // Get payment history (authenticated)
  app.get(
    '/history',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const payments = await getPaymentHistory(request.user!.userId);
      return reply.code(200).send({ payments });
    }
  );

  // Get extra vehicle price info (public)
  app.get('/extra-vehicle/price', async (_request, reply) => {
    const priceInfo = getExtraVehiclePrice();
    return reply.code(200).send(priceInfo);
  });

  // Create order for extra vehicle purchase (authenticated)
  app.post<{ Body: { quantity?: number } }>(
    '/extra-vehicle/order',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const quantity = request.body?.quantity ?? 1; // Use nullish coalescing to allow 0
      const order = await createExtraVehicleOrder(request.user!.userId, quantity);
      return reply.code(201).send(order);
    }
  );

  // Verify and complete extra vehicle purchase (authenticated)
  app.post<{
    Body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    };
  }>(
    '/extra-vehicle/verify',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        request.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Missing required payment verification fields',
        });
      }

      const result = await verifyExtraVehiclePurchase(
        request.user!.userId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      return reply.code(200).send(result);
    }
  );

  // Get vehicle purchase history (authenticated)
  app.get(
    '/extra-vehicle/history',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const purchases = await getVehiclePurchaseHistory(request.user!.userId);
      return reply.code(200).send({ purchases });
    }
  );

  // Razorpay webhook (A08 Data Integrity - signature verification)
  app.post(
    '/webhook',
    {
      ...createRouteRateLimit(RATE_LIMITS.webhook),
      config: {
        rawBody: true, // Needed for signature verification
      },
    },
    async (request, reply) => {
      const signature = request.headers['x-razorpay-signature'] as string;

      if (!signature) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Missing webhook signature',
        });
      }

      // Get raw body for signature verification
      const rawBody =
        typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body);

      // Verify signature (A08 Data Integrity)
      if (!verifyWebhookSignature(rawBody, signature)) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid webhook signature',
        });
      }

      const payload = request.body as Record<string, unknown>;
      const event = payload.event as string;

      try {
        await processWebhookEvent(event, payload);
        return reply.code(200).send({ received: true });
      } catch (error) {
        console.error('Webhook processing error:', error);
        // Return 200 to prevent Razorpay retries for processing errors
        return reply.code(200).send({ received: true, processed: false });
      }
    }
  );
}

export default paymentRoutes;
