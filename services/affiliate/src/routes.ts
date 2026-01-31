import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../generated/prisma/index.js';
import {
  createLogger,
  handleError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@safetag/service-utils';
import { z } from 'zod';
import { calculateCommission } from './services/commission.js';

const prisma = new PrismaClient();
const logger = createLogger('affiliate-routes');

// ─── Schemas ─────────────────────────────────────────────

const RegisterSchema = z.object({
  businessName: z.string().min(1).max(200),
});

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const ApplyReferralSchema = z.object({
  userId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  amount: z.number().int().min(0).optional(),
});

// ─── Helpers ─────────────────────────────────────────────

function generateDealerCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ST-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getUniqueDealerCode(): Promise<string> {
  let code = generateDealerCode();
  let exists = await prisma.dealer.findUnique({ where: { dealerCode: code } });
  while (exists) {
    code = generateDealerCode();
    exists = await prisma.dealer.findUnique({ where: { dealerCode: code } });
  }
  return code;
}

function getUserFromHeaders(request: FastifyRequest): { userId: string; role: string } {
  const userId = request.headers['x-user-id'] as string;
  const role = request.headers['x-user-role'] as string;
  return { userId: userId || '', role: role || '' };
}

// ─── Route Registration ──────────────────────────────────

export function registerRoutes(app: FastifyInstance): void {
  // POST /api/affiliate/register
  app.post('/api/affiliate/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = getUserFromHeaders(request);

      if (role !== 'DEALER') {
        const { statusCode, body } = handleError(new ForbiddenError('Only users with DEALER role can register as affiliate'));
        return reply.code(statusCode).send(body);
      }

      if (!userId) {
        const { statusCode, body } = handleError(new ValidationError('Missing x-user-id header'));
        return reply.code(statusCode).send(body);
      }

      const parsed = RegisterSchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError(parsed.error.errors[0].message));
        return reply.code(statusCode).send(body);
      }

      // Check if already registered
      const existing = await prisma.dealer.findUnique({ where: { userId } });
      if (existing) {
        const { statusCode, body } = handleError(new ValidationError('User is already registered as a dealer'));
        return reply.code(statusCode).send(body);
      }

      const dealerCode = await getUniqueDealerCode();

      const dealer = await prisma.dealer.create({
        data: {
          userId,
          dealerCode,
          businessName: parsed.data.businessName,
          isApproved: false,
        },
      });

      return reply.code(201).send({
        success: true,
        data: {
          id: dealer.id,
          dealerCode: dealer.dealerCode,
          businessName: dealer.businessName,
          isApproved: dealer.isApproved,
          createdAt: dealer.createdAt,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error registering dealer');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // GET /api/affiliate/dashboard
  app.get('/api/affiliate/dashboard', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = getUserFromHeaders(request);
      if (!userId) {
        const { statusCode, body } = handleError(new ValidationError('Missing x-user-id header'));
        return reply.code(statusCode).send(body);
      }

      const dealer = await prisma.dealer.findUnique({ where: { userId } });
      if (!dealer) {
        const { statusCode, body } = handleError(new NotFoundError('Dealer'));
        return reply.code(statusCode).send(body);
      }

      const [totalReferrals, totalEarningsResult, pendingPayoutsResult, recentReferrals] = await Promise.all([
        prisma.referral.count({ where: { dealerId: dealer.id } }),
        prisma.referral.aggregate({
          where: { dealerId: dealer.id, status: 'PAID' },
          _sum: { commissionAmount: true },
        }),
        prisma.referral.aggregate({
          where: { dealerId: dealer.id, status: 'PENDING' },
          _sum: { commissionAmount: true },
        }),
        prisma.referral.findMany({
          where: { dealerId: dealer.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      return reply.send({
        success: true,
        data: {
          dealerCode: dealer.dealerCode,
          businessName: dealer.businessName,
          isApproved: dealer.isApproved,
          totalReferrals,
          totalEarnings: totalEarningsResult._sum.commissionAmount || 0,
          pendingEarnings: pendingPayoutsResult._sum.commissionAmount || 0,
          recentReferrals,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error fetching dashboard');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // GET /api/affiliate/referrals
  app.get('/api/affiliate/referrals', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = getUserFromHeaders(request);
      if (!userId) {
        const { statusCode, body } = handleError(new ValidationError('Missing x-user-id header'));
        return reply.code(statusCode).send(body);
      }

      const dealer = await prisma.dealer.findUnique({ where: { userId } });
      if (!dealer) {
        const { statusCode, body } = handleError(new NotFoundError('Dealer'));
        return reply.code(statusCode).send(body);
      }

      const parsed = PaginationSchema.safeParse(request.query);
      const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };
      const skip = (page - 1) * limit;

      const [referrals, total] = await Promise.all([
        prisma.referral.findMany({
          where: { dealerId: dealer.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.referral.count({ where: { dealerId: dealer.id } }),
      ]);

      return reply.send({
        success: true,
        data: referrals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error fetching referrals');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // POST /api/affiliate/referrals/:code/apply
  // Internal route: called when a new user signs up with a dealer code
  app.post('/api/affiliate/referrals/:code/apply', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code } = request.params as { code: string };

      const parsed = ApplyReferralSchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError(parsed.error.errors[0].message));
        return reply.code(statusCode).send(body);
      }

      const dealer = await prisma.dealer.findUnique({ where: { dealerCode: code } });
      if (!dealer) {
        const { statusCode, body } = handleError(new NotFoundError('Dealer with this code'));
        return reply.code(statusCode).send(body);
      }

      if (!dealer.isApproved) {
        const { statusCode, body } = handleError(new ValidationError('Dealer is not yet approved'));
        return reply.code(statusCode).send(body);
      }

      // Check if this user already has a referral
      const existingReferral = await prisma.referral.findFirst({
        where: { referredUserId: parsed.data.userId },
      });
      if (existingReferral) {
        const { statusCode, body } = handleError(new ValidationError('User already has a referral'));
        return reply.code(statusCode).send(body);
      }

      const paymentNumber = 1;
      const amount = parsed.data.amount || 0;
      const { percent, commission } = calculateCommission(paymentNumber, amount);

      const referral = await prisma.referral.create({
        data: {
          dealerId: dealer.id,
          referredUserId: parsed.data.userId,
          subscriptionId: parsed.data.subscriptionId || null,
          commissionPercent: percent,
          commissionAmount: commission,
          paymentNumber,
          status: 'PENDING',
        },
      });

      logger.info({ dealerCode: code, userId: parsed.data.userId }, 'Referral applied');

      return reply.code(201).send({
        success: true,
        data: referral,
      });
    } catch (err) {
      logger.error({ err }, 'Error applying referral');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // GET /api/affiliate/payouts
  app.get('/api/affiliate/payouts', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = getUserFromHeaders(request);
      if (!userId) {
        const { statusCode, body } = handleError(new ValidationError('Missing x-user-id header'));
        return reply.code(statusCode).send(body);
      }

      const dealer = await prisma.dealer.findUnique({ where: { userId } });
      if (!dealer) {
        const { statusCode, body } = handleError(new NotFoundError('Dealer'));
        return reply.code(statusCode).send(body);
      }

      const parsed = PaginationSchema.safeParse(request.query);
      const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };
      const skip = (page - 1) * limit;

      const [payouts, total] = await Promise.all([
        prisma.payout.findMany({
          where: { dealerId: dealer.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.payout.count({ where: { dealerId: dealer.id } }),
      ]);

      return reply.send({
        success: true,
        data: payouts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error fetching payouts');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // POST /api/affiliate/payouts/request
  app.post('/api/affiliate/payouts/request', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = getUserFromHeaders(request);
      if (!userId) {
        const { statusCode, body } = handleError(new ValidationError('Missing x-user-id header'));
        return reply.code(statusCode).send(body);
      }

      const dealer = await prisma.dealer.findUnique({ where: { userId } });
      if (!dealer) {
        const { statusCode, body } = handleError(new NotFoundError('Dealer'));
        return reply.code(statusCode).send(body);
      }

      if (!dealer.isApproved) {
        const { statusCode, body } = handleError(new ForbiddenError('Dealer is not yet approved'));
        return reply.code(statusCode).send(body);
      }

      // Calculate pending earnings
      const pendingEarnings = await prisma.referral.aggregate({
        where: { dealerId: dealer.id, status: 'PENDING' },
        _sum: { commissionAmount: true },
      });

      const amount = pendingEarnings._sum.commissionAmount || 0;

      if (amount <= 0) {
        const { statusCode, body } = handleError(new ValidationError('No pending earnings to pay out'));
        return reply.code(statusCode).send(body);
      }

      // Create payout and mark referrals as PAID in a transaction
      const payout = await prisma.$transaction(async (tx: any) => {
        // Mark all pending referrals as PAID
        await tx.referral.updateMany({
          where: { dealerId: dealer.id, status: 'PENDING' },
          data: { status: 'PAID' },
        });

        // Create payout record
        return tx.payout.create({
          data: {
            dealerId: dealer.id,
            amount,
            status: 'PENDING',
          },
        });
      });

      logger.info({ dealerId: dealer.id, amount }, 'Payout requested');

      return reply.code(201).send({
        success: true,
        data: payout,
      });
    } catch (err) {
      logger.error({ err }, 'Error requesting payout');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });
}
