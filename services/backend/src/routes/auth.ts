import { FastifyInstance } from 'fastify';
import {
  sendOtp,
  verifyOtp,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  logout,
} from '../services/auth.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { createRouteRateLimit, RATE_LIMITS } from '../middleware/rate-limit.js';
import {
  otpSendSchema,
  otpVerifySchema,
  refreshTokenSchema,
  updateProfileSchema,
  OtpSendInput,
  OtpVerifyInput,
  UpdateProfileInput,
} from '../lib/validation.js';

async function authRoutes(app: FastifyInstance): Promise<void> {
  // Send OTP
  app.post<{ Body: OtpSendInput }>(
    '/otp/send',
    {
      ...createRouteRateLimit(RATE_LIMITS.otpSend),
    },
    async (request, reply) => {
      const body = otpSendSchema.parse(request.body);
      const result = await sendOtp(body.phone);
      return reply.code(200).send(result);
    }
  );

  // Verify OTP
  app.post<{ Body: OtpVerifyInput }>(
    '/otp/verify',
    {
      ...createRouteRateLimit(RATE_LIMITS.otpVerify),
    },
    async (request, reply) => {
      const body = otpVerifySchema.parse(request.body);
      const result = await verifyOtp(body.phone, body.code);
      return reply.code(200).send(result);
    }
  );

  // Refresh token
  app.post<{ Body: { refreshToken: string } }>(
    '/refresh',
    async (request, reply) => {
      const body = refreshTokenSchema.parse(request.body);
      const result = await refreshAccessToken(body.refreshToken);
      return reply.code(200).send(result);
    }
  );

  // Get current user profile (authenticated)
  app.get(
    '/me',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const profile = await getUserProfile(request.user!.userId);
      return reply.code(200).send(profile);
    }
  );

  // Update user profile (authenticated)
  app.patch<{ Body: UpdateProfileInput }>(
    '/me',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const body = updateProfileSchema.parse(request.body);
      const profile = await updateUserProfile(request.user!.userId, body);
      return reply.code(200).send(profile);
    }
  );

  // Logout (authenticated)
  app.post(
    '/logout',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      await logout(request.user!.userId);
      return reply.code(200).send({ success: true, message: 'Logged out' });
    }
  );
}

export default authRoutes;
