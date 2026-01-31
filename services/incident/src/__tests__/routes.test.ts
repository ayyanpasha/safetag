import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { registerRoutes } from '../routes.js';

vi.mock('../../generated/prisma/index.js', () => {
  const mockPrisma = {
    incident: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return { PrismaClient: class { constructor() { return mockPrisma; } } };
});

vi.mock('@safetag/service-utils', () => ({
  NotFoundError: class extends Error {
    statusCode = 404;
    constructor(r = 'Resource') { super(`${r} not found`); }
  },
  UnauthorizedError: class extends Error {
    statusCode = 401;
    constructor(msg = 'Unauthorized') { super(msg); }
  },
  ValidationError: class extends Error {
    statusCode = 400;
    constructor(msg = 'Validation failed') { super(msg); }
  },
  handleError: (err: any) => ({
    statusCode: err.statusCode || 500,
    body: { success: false, error: err.message },
  }),
  decryptSessionToken: vi.fn(() => ({
    vehicleId: 'v-1',
    ownerId: 'owner-1',
    expiresAt: Date.now() + 1800000,
  })),
  publishEvent: vi.fn(),
}));

vi.mock('../services/s3.js', () => ({
  uploadPhoto: vi.fn().mockResolvedValue('https://s3.example.com/photo.jpg'),
}));

const { PrismaClient } = await import('../../generated/prisma/index.js');
const prisma = new PrismaClient() as any;

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const userId = 'owner-1';
const headers = { 'x-user-id': userId, 'x-user-role': 'OWNER' };

function buildApp() {
  const app = Fastify();
  registerRoutes(app);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
});

describe('GET /api/incidents', () => {
  it('returns incidents for owner', async () => {
    prisma.incident.findMany.mockResolvedValue([
      { id: 'inc-1', emergencyType: 'ACCIDENT', status: 'OPEN' },
    ]);

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/incidents',
      headers,
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
  });

  it('returns 401 without auth headers', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/incidents' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/incidents/:id', () => {
  it('returns incident for owner', async () => {
    prisma.incident.findUnique.mockResolvedValue({
      id: 'inc-1',
      ownerId: userId,
      emergencyType: 'THEFT',
      status: 'OPEN',
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/incidents/inc-1',
      headers,
    });

    expect(res.statusCode).toBe(200);
  });

  it('returns 404 for wrong owner', async () => {
    prisma.incident.findUnique.mockResolvedValue({
      id: 'inc-1',
      ownerId: 'other-user',
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/incidents/inc-1',
      headers,
    });

    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /api/incidents/:id/status', () => {
  it('updates incident status to ACKNOWLEDGED', async () => {
    prisma.incident.findUnique.mockResolvedValue({ id: 'inc-1', ownerId: userId });
    prisma.incident.update.mockResolvedValue({
      id: 'inc-1',
      status: 'ACKNOWLEDGED',
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/incidents/inc-1/status',
      headers,
      payload: { status: 'ACKNOWLEDGED' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.status).toBe('ACKNOWLEDGED');
  });

  it('updates incident status to RESOLVED', async () => {
    prisma.incident.findUnique.mockResolvedValue({ id: 'inc-1', ownerId: userId });
    prisma.incident.update.mockResolvedValue({ id: 'inc-1', status: 'RESOLVED' });

    const app = buildApp();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/incidents/inc-1/status',
      headers,
      payload: { status: 'RESOLVED' },
    });

    expect(res.statusCode).toBe(200);
  });

  it('rejects invalid status', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/incidents/inc-1/status',
      headers,
      payload: { status: 'INVALID' },
    });

    expect(res.statusCode).toBe(400);
  });
});
