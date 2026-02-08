import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { redis } from '../lib/redis.js';

// Rate limit configurations (A04, A07)
export const RATE_LIMITS = {
  // Global rate limit
  global: {
    max: 100,
    timeWindow: '1 minute',
  },
  // Strict limits for auth endpoints (brute force protection)
  otpSend: {
    max: 5,
    timeWindow: '1 minute',
  },
  otpVerify: {
    max: 10,
    timeWindow: '1 minute',
  },
  // Scan endpoints
  scan: {
    max: 20,
    timeWindow: '1 minute',
  },
  // VoIP endpoints
  voip: {
    max: 10,
    timeWindow: '1 minute',
  },
  // Webhook (should be high but protected by signature)
  webhook: {
    max: 100,
    timeWindow: '1 minute',
  },
} as const;

// Register global rate limiting
export async function registerRateLimiting(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: RATE_LIMITS.global.max,
    timeWindow: RATE_LIMITS.global.timeWindow,
    redis,
    keyGenerator: (request: FastifyRequest) => {
      // Use user ID if authenticated, otherwise IP
      return request.user?.userId || request.ip;
    },
    errorResponseBuilder: (
      _request: FastifyRequest,
      context: { max: number; after: string }
    ) => ({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Maximum ${context.max} requests allowed. Try again ${context.after}.`,
      statusCode: 429,
    }),
  });
}

// Create route-specific rate limit config
export function createRouteRateLimit(config: {
  max: number;
  timeWindow: string;
}) {
  return {
    config: {
      rateLimit: {
        max: config.max,
        timeWindow: config.timeWindow,
        keyGenerator: (request: FastifyRequest) => {
          // For auth routes, key by phone number if present
          const body = request.body as Record<string, unknown>;
          if (body?.phone && typeof body.phone === 'string') {
            return `phone:${body.phone}`;
          }
          return request.ip;
        },
      },
    },
  };
}

// Fingerprint-based rate limiting for scan endpoints
const fingerprintRateLimitCache = new Map<string, { count: number; resetAt: number }>();
const FINGERPRINT_MAX_SCANS = 5;
const FINGERPRINT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function fingerprintRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const body = request.body as Record<string, unknown>;
  const fingerprint = body?.fingerprint as string;

  if (!fingerprint) {
    return; // Let validation handle missing fingerprint
  }

  const sanitizedFingerprint = fingerprint.slice(0, 500);
  const now = Date.now();

  // Check Redis first for distributed rate limiting
  const redisKey = `ratelimit:fingerprint:${sanitizedFingerprint}`;
  const redisCount = await redis.get(redisKey);

  if (redisCount) {
    const count = parseInt(redisCount, 10);
    if (count >= FINGERPRINT_MAX_SCANS) {
      return reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Too many scans from this device. Please try again later.',
      });
    }
    await redis.incr(redisKey);
  } else {
    await redis.setex(redisKey, FINGERPRINT_WINDOW_MS / 1000, '1');
  }

  // Also maintain local cache for faster checks
  let entry = fingerprintRateLimitCache.get(sanitizedFingerprint);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + FINGERPRINT_WINDOW_MS };
    fingerprintRateLimitCache.set(sanitizedFingerprint, entry);
  }

  entry.count++;

  // Cleanup old entries periodically
  if (fingerprintRateLimitCache.size > 10000) {
    for (const [key, value] of fingerprintRateLimitCache.entries()) {
      if (now > value.resetAt) {
        fingerprintRateLimitCache.delete(key);
      }
    }
  }
}
