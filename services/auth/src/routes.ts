import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../generated/prisma/index.js';
import {
  createLogger,
  handleError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  publishEvent,
  redis,
} from '@safetag/service-utils';
import {
  OtpSendSchema,
  OtpVerifySchema,
  EVENTS,
} from '@safetag/shared-types';
import { z } from 'zod';

const prisma = new PrismaClient();
const logger = createLogger('auth-routes');

// ─── Auth Middleware ──────────────────────────────────────

async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const { statusCode, body } = handleError(new UnauthorizedError('Missing or invalid Authorization header'));
    reply.code(statusCode).send(body);
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    (request as any).user = payload;
  } catch {
    const { statusCode, body } = handleError(new UnauthorizedError('Invalid or expired access token'));
    reply.code(statusCode).send(body);
  }
}

// ─── Schemas ─────────────────────────────────────────────

const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  emergencyContact: z.string().optional(),
  dndEnabled: z.boolean().optional(),
  dndStart: z.string().nullable().optional(),
  dndEnd: z.string().nullable().optional(),
});

// ─── Helpers ─────────────────────────────────────────────

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const OTP_MAX_ATTEMPTS = 5;
const OTP_ATTEMPTS_TTL = 900; // 15 minutes

async function checkOtpAttempts(phone: string): Promise<void> {
  const key = `auth:otp:attempts:${phone}`;
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, OTP_ATTEMPTS_TTL);
  }
  if (attempts > OTP_MAX_ATTEMPTS) {
    throw new ForbiddenError('Too many OTP attempts. Try again later.');
  }
}

async function clearOtpAttempts(phone: string): Promise<void> {
  await redis.del(`auth:otp:attempts:${phone}`);
}

// ─── Route Registration ──────────────────────────────────

export function registerRoutes(app: FastifyInstance): void {
  // POST /api/auth/otp/send
  app.post('/api/auth/otp/send', async (request, reply) => {
    try {
      const parsed = OtpSendSchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError(parsed.error.errors[0].message));
        return reply.code(statusCode).send(body);
      }

      const { phone } = parsed.data;
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await prisma.otpCode.create({
        data: { phone, code, expiresAt },
      });

      logger.info({ phone }, 'OTP generated');

      // In production, send OTP via SMS gateway here
      return reply.send({
        success: true,
        message: 'OTP sent successfully',
        ...(process.env.NODE_ENV !== 'production' && { data: { otp: code } }),
      });
    } catch (err) {
      logger.error({ err }, 'Failed to send OTP');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // POST /api/auth/otp/verify
  app.post('/api/auth/otp/verify', async (request, reply) => {
    try {
      const parsed = OtpVerifySchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError(parsed.error.errors[0].message));
        return reply.code(statusCode).send(body);
      }

      const { phone, otp } = parsed.data;

      // Check brute-force protection
      await checkOtpAttempts(phone);

      const otpRecord = await prisma.otpCode.findFirst({
        where: {
          phone,
          code: otp,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        const { statusCode, body } = handleError(new UnauthorizedError('Invalid or expired OTP'));
        return reply.code(statusCode).send(body);
      }

      // Mark OTP as used
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });

      // Clear brute-force counter on success
      await clearOtpAttempts(phone);

      // Upsert user
      const existingUser = await prisma.user.findUnique({ where: { phone } });
      const isNewUser = !existingUser;

      const user = await prisma.user.upsert({
        where: { phone },
        update: { updatedAt: new Date() },
        create: { phone },
      });

      // Generate tokens
      const tokenPayload = { userId: user.id, phone: user.phone, role: user.role };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Store refresh token for rotation
      await redis.set(`auth:refresh:${user.id}`, refreshToken, 'EX', 30 * 24 * 60 * 60);

      // Publish event if new user
      if (isNewUser) {
        await publishEvent(EVENTS.USER_CREATED, {
          userId: user.id,
          phone: user.phone,
          role: user.role,
        });
        logger.info({ userId: user.id }, 'New user created');
      }

      return reply.send({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            role: user.role,
          },
          isNewUser,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to verify OTP');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // POST /api/auth/refresh
  app.post('/api/auth/refresh', async (request, reply) => {
    try {
      const parsed = RefreshSchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError('refreshToken is required'));
        return reply.code(statusCode).send(body);
      }

      const { refreshToken } = parsed.data;

      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        const { statusCode, body } = handleError(new UnauthorizedError('Invalid or expired refresh token'));
        return reply.code(statusCode).send(body);
      }

      // Check if refresh token has been revoked
      const tokenKey = `auth:refresh:${payload.userId}`;
      const storedToken = await redis.get(tokenKey);
      if (!storedToken || storedToken !== refreshToken) {
        const { statusCode, body } = handleError(new UnauthorizedError('Refresh token revoked'));
        return reply.code(statusCode).send(body);
      }

      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        const { statusCode, body } = handleError(new UnauthorizedError('User not found'));
        return reply.code(statusCode).send(body);
      }

      const tokenPayload = { userId: user.id, phone: user.phone, role: user.role };
      const accessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      // Rotate: store new refresh token, revoking old one
      await redis.set(`auth:refresh:${user.id}`, newRefreshToken, 'EX', 30 * 24 * 60 * 60);

      return reply.send({
        success: true,
        data: { accessToken, refreshToken: newRefreshToken },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to refresh token');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // GET /api/auth/me
  app.get('/api/auth/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { userId } = (request as any).user;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        const { statusCode, body } = handleError(new UnauthorizedError('User not found'));
        return reply.code(statusCode).send(body);
      }

      return reply.send({
        success: true,
        data: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          emergencyContact: user.emergencyContact,
          dndEnabled: user.dndEnabled,
          dndStart: user.dndStart,
          dndEnd: user.dndEnd,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to get profile');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // PATCH /api/auth/me
  app.patch('/api/auth/me', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { userId } = (request as any).user;

      const parsed = UpdateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError(parsed.error.errors[0].message));
        return reply.code(statusCode).send(body);
      }

      const updateData = parsed.data;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return reply.send({
        success: true,
        data: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
          emergencyContact: user.emergencyContact,
          dndEnabled: user.dndEnabled,
          dndStart: user.dndStart,
          dndEnd: user.dndEnd,
          createdAt: user.createdAt.toISOString(),
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to update profile');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });
}
