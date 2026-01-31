import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { registerRoutes } from '../routes.js';

vi.mock('../../generated/prisma/index.js', () => {
  const mockPrisma = {
    subscription: { findUnique: vi.fn(), upsert: vi.fn() },
    payment: { create: vi.fn(), upsert: vi.fn() },
  };
  return { PrismaClient: class { constructor() { return mockPrisma; } } };
});

vi.mock('@safetag/service-utils', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  handleError: (err: any) => ({
    statusCode: err.statusCode || 500,
    body: { success: false, error: err.message },
  }),
  NotFoundError: class extends Error {
    statusCode = 404;
    constructor(r = 'Resource') { super(`${r} not found`); }
  },
  ValidationError: class extends Error {
    statusCode = 400;
    constructor(msg = 'Validation failed') { super(msg); }
  },
  publishEvent: vi.fn(),
}));

vi.mock('../services/razorpay.js', () => ({
  createSubscription: vi.fn().mockResolvedValue({
    subscriptionId: 'sub_123',
    shortUrl: 'https://rzp.io/test',
  }),
  verifyWebhookSignature: vi.fn((body: string, sig: string) => sig === 'valid-sig'),
}));

const { PrismaClient } = await import('../../generated/prisma/index.js');
const prisma = new PrismaClient() as any;

function buildApp() {
  const app = Fastify();
  registerRoutes(app);
  return app;
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/payments/plans', () => {
  it('returns plan details', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/payments/plans' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.MONTHLY.price).toBe(299);
    expect(body.data.YEARLY.vehicleLimit).toBe(10);
  });
});

describe('GET /api/payments/subscription', () => {
  it('returns null when no subscription', async () => {
    prisma.subscription.findUnique.mockResolvedValue(null);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/payments/subscription',
      headers: { 'x-user-id': 'user-1' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toBeNull();
  });

  it('returns subscription when exists', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      plan: 'MONTHLY',
      status: 'ACTIVE',
      payments: [],
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/payments/subscription',
      headers: { 'x-user-id': 'user-1' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.plan).toBe('MONTHLY');
  });
});

describe('POST /api/payments/subscribe', () => {
  it('creates subscription for valid plan', async () => {
    prisma.subscription.findUnique.mockResolvedValue(null);
    prisma.subscription.upsert.mockResolvedValue({
      id: 'sub-1',
      plan: 'MONTHLY',
      status: 'TRIALING',
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/payments/subscribe',
      headers: { 'x-user-id': 'user-1', 'x-user-phone': '+919876543210' },
      payload: { plan: 'MONTHLY' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.shortUrl).toBe('https://rzp.io/test');
  });

  it('rejects when active subscription exists', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      status: 'ACTIVE',
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/payments/subscribe',
      headers: { 'x-user-id': 'user-1' },
      payload: { plan: 'MONTHLY' },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/payments/webhook', () => {
  it('returns 400 for missing signature', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      payload: { event: 'subscription.activated' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for invalid signature', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: { 'x-razorpay-signature': 'bad-sig' },
      payload: { event: 'subscription.activated' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('processes subscription.activated event', async () => {
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-1',
      plan: 'MONTHLY',
      vehicleLimit: 3,
    });
    prisma.subscription.update = vi.fn().mockResolvedValue({});

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/payments/webhook',
      headers: { 'x-razorpay-signature': 'valid-sig' },
      payload: {
        event: 'subscription.activated',
        payload: {
          subscription: {
            entity: { id: 'rzp_sub_1', customer_id: 'cust_1' },
          },
        },
      },
    });

    expect(res.statusCode).toBe(200);
  });
});
