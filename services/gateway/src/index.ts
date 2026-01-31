import Fastify from 'fastify';
import cors from '@fastify/cors';
import { logger } from '@safetag/service-utils';
import authMiddleware from './auth-middleware.js';
import { registerRateLimiting } from './rate-limit.js';
import { registerProxyRoutes, getServiceRoutes } from './proxy.js';

const PORT = parseInt(process.env.GATEWAY_PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  // Register CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Token'],
  });

  // Register rate limiting
  await registerRateLimiting(app);

  // Register auth middleware
  await app.register(authMiddleware);

  // Register proxy routes
  await registerProxyRoutes(app);

  // Health check that aggregates downstream service health
  app.get('/api/health', async (_request, reply) => {
    const routes = getServiceRoutes();
    const results: Record<string, { status: string; latency?: number }> = {};

    const checks = routes.map(async (route) => {
      const serviceName = route.prefix.replace('/api/', '');
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${route.upstream}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const latency = Date.now() - start;
        results[serviceName] = {
          status: response.ok ? 'healthy' : 'unhealthy',
          latency,
        };
      } catch {
        results[serviceName] = {
          status: 'unreachable',
          latency: Date.now() - start,
        };
      }
    });

    await Promise.allSettled(checks);

    const allHealthy = Object.values(results).every((r) => r.status === 'healthy');

    return reply.status(allHealthy ? 200 : 503).send({
      status: allHealthy ? 'healthy' : 'degraded',
      gateway: 'healthy',
      services: results,
      timestamp: new Date().toISOString(),
    });
  });

  try {
    await app.listen({ port: PORT, host: HOST });
    logger.info(`Gateway listening on ${HOST}:${PORT}`);
  } catch (err) {
    logger.error(err, 'Failed to start gateway');
    process.exit(1);
  }
}

main();
