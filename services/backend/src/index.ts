import 'dotenv/config';
import Fastify from 'fastify';
import {
  registerSecurityHeaders,
  registerCors,
  sanitizeRequestMiddleware,
  requestIdMiddleware,
  contentTypeMiddleware,
  parameterPollutionMiddleware,
} from './middleware/security.js';
import {
  registerRateLimiting,
} from './middleware/rate-limit.js';
import {
  registerErrorHandler,
  registerResponseLogging,
  requestLoggingMiddleware,
} from './middleware/error-handler.js';
import { registerRoutes } from './routes/index.js';
import { initAffiliateEventListeners } from './services/affiliate.service.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  // Create Fastify instance with logging
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    trustProxy: true, // Trust X-Forwarded-* headers
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
  });

  try {
    // Register security middleware (A05 Security Misconfiguration)
    await registerSecurityHeaders(app);
    await registerCors(app);

    // Register rate limiting (A04, A07)
    await registerRateLimiting(app);

    // Register global hooks
    app.addHook('preHandler', requestIdMiddleware);
    app.addHook('preHandler', contentTypeMiddleware);
    app.addHook('preHandler', parameterPollutionMiddleware);
    app.addHook('preHandler', sanitizeRequestMiddleware);
    app.addHook('preHandler', requestLoggingMiddleware);

    // Register error handler (A04, A09)
    registerErrorHandler(app);
    registerResponseLogging(app);

    // Register routes
    await registerRoutes(app);

    // Initialize event listeners
    initAffiliateEventListeners();

    // Test database connection
    await prisma.$connect();
    app.log.info('Database connected');

    // Test Redis connection
    await redis.ping();
    app.log.info('Redis connected');

    // Start server
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`SafeTag Backend running on http://${HOST}:${PORT}`);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);

      try {
        await app.close();
        await prisma.$disconnect();
        await redis.quit();
        app.log.info('Server closed');
        process.exit(0);
      } catch (error) {
        app.log.error({ err: error }, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    app.log.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

main();
