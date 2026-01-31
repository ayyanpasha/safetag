import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

export async function registerRateLimiting(app: FastifyInstance): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.headers['x-forwarded-for'] as string || request.ip;
    },
    errorResponseBuilder: (_request, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      };
    },
  });

  // Per-route rate limits
  app.after(() => {
    app.addHook('onRoute', (routeOptions) => {
      const existingConfig = routeOptions.config || {};

      if (routeOptions.url === '/api/auth/otp/send') {
        routeOptions.config = {
          ...existingConfig,
          rateLimit: { max: 5, timeWindow: '1 minute' },
        };
      } else if (routeOptions.url === '/api/auth/otp/verify') {
        routeOptions.config = {
          ...existingConfig,
          rateLimit: { max: 10, timeWindow: '1 minute' },
        };
      } else if (routeOptions.url.startsWith('/api/scan')) {
        routeOptions.config = {
          ...existingConfig,
          rateLimit: { max: 20, timeWindow: '1 minute' },
        };
      }
    });
  });
}
