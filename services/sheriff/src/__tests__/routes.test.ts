import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';

vi.hoisted(() => {
  process.env.INTERNAL_API_KEY = 'internal-secret';
});

import { registerRoutes } from '../routes.js';

vi.mock('../../generated/prisma/index.js', () => {
  const mockPrisma = {
    scanSession: { create: vi.fn(), findUnique: vi.fn() },
    blocklist: { findUnique: vi.fn(), upsert: vi.fn() },
  };
  return { PrismaClient: class { constructor() { return mockPrisma; } } };
});

vi.mock('@safetag/service-utils', () => ({
  encryptSessionToken: vi.fn(() => 'encrypted-token'),
  decryptSessionToken: vi.fn((token: string) => {
    if (token === 'valid-token') {
      return {
        vehicleNumber: 'KA01AB1234',
        lat: 12.97,
        lng: 77.59,
        ownerId: 'owner-1',
        vehicleId: 'v-1',
        exp: Date.now() + 1800000,
      };
    }
    if (token === 'expired-token') {
      return { exp: Date.now() - 1000 };
    }
    throw new Error('Invalid token');
  }),
  redis: {
    incr: vi.fn(() => 1),
    expire: vi.fn(),
  },
  publishEvent: vi.fn(),
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
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const { PrismaClient } = await import('../../generated/prisma/index.js');
const prisma = new PrismaClient() as any;

// Mock global fetch for vehicle service calls
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function buildApp() {
  const app = Fastify();
  registerRoutes(app);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  prisma.blocklist.findUnique.mockResolvedValue(null);
});

describe('POST /api/scan/initiate', () => {
  it('returns session token for valid scan', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { vehicle: { id: 'v-1', userId: 'owner-1', vehicleNumber: 'KA01AB1234' }, userId: 'owner-1' },
      }),
    });
    prisma.scanSession.create.mockResolvedValue({});

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan/initiate',
      payload: {
        shortCode: 'ST-ABCDE',
        vehicleNumber: 'KA01AB1234',
        location: { latitude: 12.97, longitude: 77.59 },
        fingerprint: 'fp-123',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.sessionToken).toBe('encrypted-token');
  });

  it('returns 403 for blocked fingerprint', async () => {
    prisma.blocklist.findUnique.mockResolvedValue({ fingerprint: 'blocked-fp' });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { vehicle: { id: 'v-1', userId: 'owner-1', vehicleNumber: 'KA01AB1234' }, userId: 'owner-1' },
      }),
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan/initiate',
      payload: {
        shortCode: 'ST-ABCDE',
        vehicleNumber: 'KA01AB1234',
        location: { latitude: 12.97, longitude: 77.59 },
        fingerprint: 'blocked-fp',
      },
    });

    expect(res.statusCode).toBe(403);
  });

  it('rate limits after 5 scans', async () => {
    const { redis } = await import('@safetag/service-utils');
    (redis.incr as any).mockResolvedValue(6);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { vehicle: { id: 'v-1', userId: 'owner-1', vehicleNumber: 'KA01AB1234' }, userId: 'owner-1' },
      }),
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan/initiate',
      payload: {
        shortCode: 'ST-ABCDE',
        vehicleNumber: 'KA01AB1234',
        location: { latitude: 12.97, longitude: 77.59 },
        fingerprint: 'fp-spam',
      },
    });

    expect(res.statusCode).toBe(403);
  });
});

describe('POST /api/scan/validate-token', () => {
  it('returns payload for valid token', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan/validate-token',
      payload: { sessionToken: 'valid-token' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.vehicleNumber).toBe('KA01AB1234');
  });

  it('returns 403 for expired token', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/scan/validate-token',
      payload: { sessionToken: 'expired-token' },
    });

    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/scan/session/:token', () => {
  it('returns scan session', async () => {
    prisma.scanSession.findUnique.mockResolvedValue({
      id: 'session-1',
      vehicleNumber: 'KA01AB1234',
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/scan/session/encrypted-token',
    });

    expect(res.statusCode).toBe(200);
  });

  it('returns 404 for unknown session', async () => {
    prisma.scanSession.findUnique.mockResolvedValue(null);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/scan/session/unknown-token',
    });

    expect(res.statusCode).toBe(404);
  });
});

describe('POST /internal/scan/blocklist', () => {
  it('adds fingerprint to blocklist', async () => {
    prisma.blocklist.upsert.mockResolvedValue({ fingerprint: 'bad-fp', reason: 'abuse' });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/internal/scan/blocklist',
      headers: { 'x-internal-api-key': 'internal-secret' },
      payload: { fingerprint: 'bad-fp', reason: 'abuse' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
  });
});
