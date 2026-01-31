import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { registerRoutes } from '../routes.js';

vi.mock('../../generated/prisma/index.js', () => {
  const mockPrisma = {
    dealer: { findUnique: vi.fn(), create: vi.fn() },
    referral: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    payout: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  };
  return { PrismaClient: class { constructor() { return mockPrisma; } } };
});

vi.mock('@safetag/service-utils', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  handleError: (err: any) => ({
    statusCode: err.statusCode || 500,
    body: { success: false, error: err.message },
  }),
  ForbiddenError: class extends Error {
    statusCode = 403;
    constructor(msg = 'Forbidden') { super(msg); }
  },
  NotFoundError: class extends Error {
    statusCode = 404;
    constructor(r = 'Resource') { super(`${r} not found`); }
  },
  ValidationError: class extends Error {
    statusCode = 400;
    constructor(msg = 'Validation failed') { super(msg); }
  },
}));

vi.mock('../services/commission.js', () => ({
  calculateCommission: vi.fn((paymentNumber: number, amount: number) => {
    if (paymentNumber === 1) return { percent: 20, commission: Math.round(amount * 0.2) };
    if (paymentNumber <= 3) return { percent: 10, commission: Math.round(amount * 0.1) };
    return { percent: 0, commission: 0 };
  }),
}));

const { PrismaClient } = await import('../../generated/prisma/index.js');
const prisma = new PrismaClient() as any;

function buildApp() {
  const app = Fastify();
  registerRoutes(app);
  return app;
}

beforeEach(() => vi.clearAllMocks());

const dealerHeaders = { 'x-user-id': 'user-1', 'x-user-role': 'DEALER' };
const ownerHeaders = { 'x-user-id': 'user-1', 'x-user-role': 'OWNER' };

describe('POST /api/affiliate/register', () => {
  it('registers a dealer', async () => {
    prisma.dealer.findUnique.mockResolvedValue(null);
    prisma.dealer.create.mockResolvedValue({
      id: 'd1',
      dealerCode: 'ST-ABC123',
      businessName: 'Test Shop',
      isApproved: false,
      createdAt: new Date(),
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/affiliate/register',
      headers: dealerHeaders,
      payload: { businessName: 'Test Shop' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().data.dealerCode).toContain('ST-');
  });

  it('rejects non-DEALER role', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/affiliate/register',
      headers: ownerHeaders,
      payload: { businessName: 'Test Shop' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('rejects duplicate registration', async () => {
    prisma.dealer.findUnique.mockResolvedValue({ id: 'existing' });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/affiliate/register',
      headers: dealerHeaders,
      payload: { businessName: 'Test Shop' },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/affiliate/dashboard', () => {
  it('returns dashboard data', async () => {
    prisma.dealer.findUnique.mockResolvedValue({ id: 'd1', dealerCode: 'ST-ABC123', businessName: 'Shop', isApproved: true });
    prisma.referral.count.mockResolvedValue(5);
    prisma.referral.aggregate.mockResolvedValue({ _sum: { commissionAmount: 1000 } });
    prisma.referral.findMany.mockResolvedValue([]);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/affiliate/dashboard',
      headers: dealerHeaders,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.totalReferrals).toBe(5);
  });

  it('returns 404 for non-dealer', async () => {
    prisma.dealer.findUnique.mockResolvedValue(null);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/affiliate/dashboard',
      headers: dealerHeaders,
    });

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/affiliate/referrals', () => {
  it('returns paginated referrals', async () => {
    prisma.dealer.findUnique.mockResolvedValue({ id: 'd1' });
    prisma.referral.findMany.mockResolvedValue([{ id: 'r1' }]);
    prisma.referral.count.mockResolvedValue(1);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/affiliate/referrals?page=1&limit=10',
      headers: dealerHeaders,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().pagination.total).toBe(1);
  });
});

describe('POST /api/affiliate/referrals/:code/apply', () => {
  it('applies referral for approved dealer', async () => {
    prisma.dealer.findUnique.mockResolvedValue({ id: 'd1', isApproved: true });
    prisma.referral.findFirst.mockResolvedValue(null);
    prisma.referral.create.mockResolvedValue({ id: 'r1', commissionPercent: 20 });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/affiliate/referrals/ST-ABC123/apply',
      payload: { userId: '550e8400-e29b-41d4-a716-446655440000', amount: 299 },
    });

    expect(res.statusCode).toBe(201);
  });

  it('rejects unapproved dealer', async () => {
    prisma.dealer.findUnique.mockResolvedValue({ id: 'd1', isApproved: false });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/affiliate/referrals/ST-ABC123/apply',
      payload: { userId: '550e8400-e29b-41d4-a716-446655440000' },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/affiliate/payouts', () => {
  it('returns paginated payouts', async () => {
    prisma.dealer.findUnique.mockResolvedValue({ id: 'd1' });
    prisma.payout.findMany.mockResolvedValue([]);
    prisma.payout.count.mockResolvedValue(0);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/affiliate/payouts',
      headers: dealerHeaders,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual([]);
  });
});
