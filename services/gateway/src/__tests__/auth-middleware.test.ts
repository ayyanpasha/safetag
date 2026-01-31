import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

vi.mock('@safetag/service-utils', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'valid-token') {
      return { userId: 'user-1', phone: '+919999999999', role: 'OWNER' };
    }
    throw new Error('Invalid token');
  }),
}));

import authMiddleware from '../auth-middleware.js';

function buildApp() {
  const app = Fastify();
  app.register(authMiddleware);
  // Add a catch-all route to test middleware behavior
  app.get('/api/vehicles', async (request, reply) => {
    return {
      userId: request.headers['x-user-id'],
      userRole: request.headers['x-user-role'],
    };
  });
  app.get('/api/auth/otp/send', async () => ({ ok: true }));
  app.get('/api/scan/initiate', async () => ({ ok: true }));
  app.get('/api/health', async () => ({ ok: true }));
  app.get('/api/contact/conversations', async () => ({ ok: true }));
  app.get('/api/incidents/report', async () => ({ ok: true }));
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Auth Middleware', () => {
  it('allows public routes without auth', async () => {
    const app = buildApp();

    const res1 = await app.inject({ method: 'GET', url: '/api/auth/otp/send' });
    expect(res1.statusCode).toBe(200);

    const res2 = await app.inject({ method: 'GET', url: '/api/scan/initiate' });
    expect(res2.statusCode).toBe(200);

    const res3 = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res3.statusCode).toBe(200);
  });

  it('allows session token routes without JWT auth', async () => {
    const app = buildApp();

    const res1 = await app.inject({ method: 'GET', url: '/api/contact/conversations' });
    expect(res1.statusCode).toBe(200);

    const res2 = await app.inject({ method: 'GET', url: '/api/incidents/report' });
    expect(res2.statusCode).toBe(200);
  });

  it('rejects protected routes without auth header', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/vehicles' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects protected routes with invalid token', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/vehicles',
      headers: { authorization: 'Bearer invalid-token' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('injects user headers for valid token', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/vehicles',
      headers: { authorization: 'Bearer valid-token' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.userId).toBe('user-1');
    expect(body.userRole).toBe('OWNER');
  });
});
