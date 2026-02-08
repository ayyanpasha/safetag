import { FastifyInstance } from 'fastify';
import {
  registerDealer,
  getDashboardStats,
  getDealerReferrals,
  applyReferralCode,
  getDealerPayouts,
  requestPayout,
  getDealerByCode,
  approveDealer,
} from '../services/affiliate.service.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  registerDealerSchema,
  payoutRequestSchema,
  RegisterDealerInput,
  PayoutRequestInput,
} from '../lib/validation.js';

async function affiliateRoutes(app: FastifyInstance): Promise<void> {
  // Register as dealer (authenticated)
  app.post<{ Body: RegisterDealerInput }>(
    '/register',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const body = registerDealerSchema.parse(request.body);
      const dealer = await registerDealer(request.user!.userId, body.businessName);
      return reply.code(201).send(dealer);
    }
  );

  // Get dealer dashboard (authenticated)
  app.get(
    '/dashboard',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const stats = await getDashboardStats(request.user!.userId);
      return reply.code(200).send(stats);
    }
  );

  // Get dealer referrals (authenticated)
  app.get<{ Querystring: { page?: string; limit?: string } }>(
    '/referrals',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const page = parseInt(request.query.page || '1', 10);
      const limit = parseInt(request.query.limit || '20', 10);

      const result = await getDealerReferrals(request.user!.userId, page, limit);
      return reply.code(200).send(result);
    }
  );

  // Apply referral code (authenticated - new user)
  app.post<{ Params: { code: string } }>(
    '/referrals/:code/apply',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const result = await applyReferralCode(
        request.user!.userId,
        request.params.code
      );
      return reply.code(200).send(result);
    }
  );

  // Validate referral code (public)
  app.get<{ Params: { code: string } }>(
    '/validate/:code',
    async (request, reply) => {
      const dealer = await getDealerByCode(request.params.code);

      if (!dealer) {
        return reply.code(404).send({
          valid: false,
          message: 'Invalid referral code',
        });
      }

      return reply.code(200).send({
        valid: dealer.isApproved,
        businessName: dealer.businessName,
        message: dealer.isApproved
          ? 'Valid referral code'
          : 'Dealer pending approval',
      });
    }
  );

  // Get dealer payouts (authenticated)
  app.get<{ Querystring: { page?: string; limit?: string } }>(
    '/payouts',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const page = parseInt(request.query.page || '1', 10);
      const limit = parseInt(request.query.limit || '20', 10);

      const result = await getDealerPayouts(request.user!.userId, page, limit);
      return reply.code(200).send(result);
    }
  );

  // Request payout (authenticated)
  app.post<{ Body: PayoutRequestInput }>(
    '/payouts/request',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const body = payoutRequestSchema.parse(request.body);
      const payout = await requestPayout(request.user!.userId, body.amount);
      return reply.code(201).send(payout);
    }
  );

  // Approve dealer (admin only)
  app.post<{ Params: { dealerId: string } }>(
    '/dealers/:dealerId/approve',
    { preHandler: [authMiddleware, requireRole('ADMIN')] },
    async (request, reply) => {
      await approveDealer(request.params.dealerId);
      return reply.code(200).send({
        success: true,
        message: 'Dealer approved',
      });
    }
  );
}

export default affiliateRoutes;
