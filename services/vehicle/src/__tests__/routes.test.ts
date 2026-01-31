import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { registerRoutes } from '../routes.js';

vi.mock('../../generated/prisma/index.js', () => {
  const mockPrisma = {
    vehicle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    checkIn: { create: vi.fn() },
  };
  return { PrismaClient: class { constructor() { return mockPrisma; } } };
});

vi.mock('@safetag/service-utils', () => ({
  NotFoundError: class extends Error {
    statusCode = 404;
    code = 'NOT_FOUND';
    constructor(r = 'Resource') { super(`${r} not found`); }
  },
  UnauthorizedError: class extends Error {
    statusCode = 401;
    constructor(msg = 'Unauthorized') { super(msg); }
  },
  ForbiddenError: class extends Error {
    statusCode = 403;
    constructor(msg = 'Forbidden') { super(msg); }
  },
  ValidationError: class extends Error {
    statusCode = 400;
    constructor(msg = 'Validation failed') { super(msg); }
  },
  handleError: (err: any) => ({
    statusCode: err.statusCode || 500,
    body: { success: false, error: err.message },
  }),
  decryptSessionToken: vi.fn((token: string) => {
    if (token === 'valid-session-token') return { vehicleId: 'v1' };
    throw new Error('Invalid session token');
  }),
}));

vi.mock('nanoid', () => ({
  customAlphabet: () => () => 'ABCDE',
}));

const { PrismaClient } = await import('../../generated/prisma/index.js');
const prisma = new PrismaClient() as any;

const userId = 'user-1';
const headers = { 'x-user-id': userId, 'x-user-role': 'OWNER' };

function buildApp() {
  const app = Fastify();
  registerRoutes(app);
  return app;
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/vehicles', () => {
  it('returns user vehicles', async () => {
    prisma.vehicle.findMany.mockResolvedValue([{ id: 'v1', vehicleNumber: 'KA01AB1234' }]);

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/vehicles', headers });

    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
  });

  it('returns 401 without auth headers', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/vehicles' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/vehicles', () => {
  it('creates a vehicle', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null); // no duplicate
    prisma.vehicle.count.mockResolvedValue(0);
    prisma.vehicle.create.mockResolvedValue({
      id: 'v1',
      userId,
      vehicleNumber: 'KA01AB1234',
      qrShortCode: 'ST-ABCDE',
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/vehicles',
      headers,
      payload: { vehicleNumber: 'KA01AB1234' },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().success).toBe(true);
  });

  it('rejects duplicate vehicle number', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'existing' });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/vehicles',
      headers,
      payload: { vehicleNumber: 'KA01AB1234' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('enforces vehicle limit', async () => {
    prisma.vehicle.findUnique.mockResolvedValue(null);
    prisma.vehicle.count.mockResolvedValue(3);

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/vehicles',
      headers,
      payload: { vehicleNumber: 'KA01AB9999' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toContain('limit');
  });
});

describe('GET /api/vehicles/:id', () => {
  it('returns vehicle with check-ins', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      userId,
      vehicleNumber: 'KA01AB1234',
      checkIns: [],
    });

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/vehicles/v1', headers });

    expect(res.statusCode).toBe(200);
  });

  it('returns 404 for wrong owner', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'v1', userId: 'other-user' });

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/vehicles/v1', headers });

    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/vehicles/:id', () => {
  it('soft deletes (deactivates) vehicle', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'v1', userId });
    prisma.vehicle.update.mockResolvedValue({});

    const app = buildApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/vehicles/v1', headers });

    expect(res.statusCode).toBe(200);
    expect(prisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { isActive: false },
    });
  });
});

describe('GET /api/vehicles/:id/qr', () => {
  it('returns QR data', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      userId,
      vehicleNumber: 'KA01AB1234',
      qrCode: 'uuid-qr',
      qrShortCode: 'ST-ABCDE',
    });

    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/vehicles/v1/qr', headers });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.qrShortCode).toBe('ST-ABCDE');
  });
});

describe('POST /api/vehicles/:id/checkin', () => {
  it('creates check-in with GPS location', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({ id: 'v1', isActive: true });
    prisma.checkIn.create.mockResolvedValue({ id: 'ci1' });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/vehicles/v1/checkin',
      headers: { 'x-session-token': 'valid-session-token' },
      payload: { latitude: 12.9716, longitude: 77.5946 },
    });

    expect(res.statusCode).toBe(201);
  });
});

describe('Internal routes', () => {
  it('GET /internal/vehicles/by-shortcode/:shortCode returns vehicle', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      id: 'v1',
      userId,
      vehicleNumber: 'KA01AB1234',
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/internal/vehicles/by-shortcode/ST-ABCDE',
      headers: { 'x-internal-api-key': 'internal-secret' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.vehicle.vehicleNumber).toBe('KA01AB1234');
  });

  it('rejects invalid internal API key', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/internal/vehicles/by-shortcode/ST-ABCDE',
      headers: { 'x-internal-api-key': 'wrong-key' },
    });

    expect(res.statusCode).toBe(403);
  });
});
