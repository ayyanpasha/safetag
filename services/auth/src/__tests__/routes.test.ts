import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { registerRoutes } from '../routes.js';

// Mock Prisma
vi.mock('../../generated/prisma/index.js', () => {
  const mockPrisma = {
    otpCode: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  };
  return { PrismaClient: class { constructor() { return mockPrisma; } } };
});

// Mock service-utils
vi.mock('@safetag/service-utils', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  handleError: (err: any) => ({
    statusCode: err.statusCode || 500,
    body: { success: false, error: err.message },
  }),
  UnauthorizedError: class extends Error {
    statusCode = 401;
    constructor(msg = 'Unauthorized') { super(msg); }
  },
  ValidationError: class extends Error {
    statusCode = 400;
    constructor(msg = 'Validation failed') { super(msg); }
  },
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'valid-token') return { userId: 'user-1', phone: '+919876543210', role: 'OWNER' };
    throw new Error('invalid token');
  }),
  verifyRefreshToken: vi.fn((token: string) => {
    if (token === 'valid-refresh') return { userId: 'user-1', phone: '+919876543210', role: 'OWNER' };
    throw new Error('invalid token');
  }),
  publishEvent: vi.fn(),
  redis: {
    incr: vi.fn(() => 1),
    expire: vi.fn(),
    del: vi.fn(),
    get: vi.fn(() => null),
    set: vi.fn(),
  },
}));

const { PrismaClient } = await import('../../generated/prisma/index.js');
const prisma = new PrismaClient() as any;

function buildApp() {
  const app = Fastify();
  registerRoutes(app);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/auth/otp/send', () => {
  it('returns success for valid phone', async () => {
    prisma.otpCode.create.mockResolvedValue({ id: 'otp-1', code: '123456' });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/otp/send',
      payload: { phone: '+919876543210' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
  });

  it('returns 400 for invalid phone', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/otp/send',
      payload: { phone: 'bad' },
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/auth/otp/verify', () => {
  it('returns tokens for valid OTP', async () => {
    prisma.otpCode.findFirst.mockResolvedValue({
      id: 'otp-1',
      phone: '+919876543210',
      code: '123456',
      used: false,
      expiresAt: new Date(Date.now() + 60000),
    });
    prisma.otpCode.update.mockResolvedValue({});
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert.mockResolvedValue({
      id: 'user-1',
      phone: '+919876543210',
      name: null,
      role: 'OWNER',
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/otp/verify',
      payload: { phone: '+919876543210', otp: '123456' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBe('mock-access-token');
    expect(body.data.refreshToken).toBe('mock-refresh-token');
    expect(body.data.isNewUser).toBe(true);
  });

  it('returns 401 for invalid OTP', async () => {
    prisma.otpCode.findFirst.mockResolvedValue(null);

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/otp/verify',
      payload: { phone: '+919876543210', otp: '000000' },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('returns new access token for valid refresh token', async () => {
    const { redis } = await import('@safetag/service-utils');
    (redis.get as any).mockResolvedValue('valid-refresh');

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      phone: '+919876543210',
      role: 'OWNER',
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken: 'valid-refresh' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.accessToken).toBe('mock-access-token');
    expect(res.json().data.refreshToken).toBe('mock-refresh-token');
  });

  it('returns 401 for invalid refresh token', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken: 'bad-token' },
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user profile with valid token', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      phone: '+919876543210',
      name: 'Test',
      email: null,
      role: 'OWNER',
      emergencyContact: null,
      dndEnabled: false,
      dndStart: null,
      dndEnd: null,
      createdAt: new Date('2025-01-01'),
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.phone).toBe('+919876543210');
  });

  it('returns 401 without auth header', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });

    expect(res.statusCode).toBe(401);
  });
});

describe('PATCH /api/auth/me', () => {
  it('updates user profile', async () => {
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      phone: '+919876543210',
      name: 'Updated Name',
      email: null,
      role: 'OWNER',
      emergencyContact: null,
      dndEnabled: false,
      dndStart: null,
      dndEnd: null,
      createdAt: new Date('2025-01-01'),
    });

    const app = buildApp();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer valid-token' },
      payload: { name: 'Updated Name' },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().data.name).toBe('Updated Name');
  });
});
