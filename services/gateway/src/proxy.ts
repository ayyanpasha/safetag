import type { FastifyInstance } from 'fastify';
import proxy from '@fastify/http-proxy';

interface ServiceRoute {
  prefix: string;
  upstream: string;
}

function getServiceRoutes(): ServiceRoute[] {
  return [
    {
      prefix: '/api/auth',
      upstream: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    },
    {
      prefix: '/api/vehicles',
      upstream: process.env.VEHICLE_SERVICE_URL || 'http://localhost:3002',
    },
    {
      prefix: '/api/scan',
      upstream: process.env.SHERIFF_SERVICE_URL || 'http://localhost:3003',
    },
    {
      prefix: '/api/contact',
      upstream: process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:3004',
    },
    {
      prefix: '/api/payments',
      upstream: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
    },
    {
      prefix: '/api/affiliate',
      upstream: process.env.AFFILIATE_SERVICE_URL || 'http://localhost:3006',
    },
    {
      prefix: '/api/incidents',
      upstream: process.env.INCIDENT_SERVICE_URL || 'http://localhost:3007',
    },
  ];
}

export async function registerProxyRoutes(app: FastifyInstance): Promise<void> {
  const routes = getServiceRoutes();

  for (const route of routes) {
    await app.register(proxy, {
      upstream: route.upstream,
      prefix: route.prefix,
      rewritePrefix: route.prefix,
      http2: false,
    });
  }
}

export { getServiceRoutes };
