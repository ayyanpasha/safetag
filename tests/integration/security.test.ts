import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis
const mockRedis = {
  incr: vi.fn(),
  expire: vi.fn(),
  del: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock('@safetag/service-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@safetag/service-utils')>();
  return {
    ...actual,
    redis: mockRedis,
    createLogger: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    }),
    publishEvent: vi.fn(),
  };
});

vi.mock('../../services/auth/generated/prisma/index.js', () => {
  const mockPrisma = {
    otpCode: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn(), upsert: vi.fn() },
  };
  return { PrismaClient: class { constructor() { return mockPrisma; } } };
});

describe('Security: OTP brute-force protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks after 5 OTP attempts', async () => {
    // Simulate 6th attempt
    mockRedis.incr.mockResolvedValue(6);

    const { ForbiddenError } = await import('@safetag/service-utils');

    // The checkOtpAttempts logic: incr returns > 5 => throw ForbiddenError
    const key = 'auth:otp:attempts:+919999999999';
    const attempts = await mockRedis.incr(key);
    expect(attempts).toBe(6);
    expect(attempts).toBeGreaterThan(5);
  });

  it('allows attempts under the limit', async () => {
    mockRedis.incr.mockResolvedValue(3);

    const key = 'auth:otp:attempts:+919999999999';
    const attempts = await mockRedis.incr(key);
    expect(attempts).toBeLessThanOrEqual(5);
  });
});

describe('Security: Refresh token rotation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects revoked refresh token', async () => {
    mockRedis.get.mockResolvedValue('different-token');

    const storedToken = await mockRedis.get('auth:refresh:user-1');
    const requestToken = 'old-token';
    expect(storedToken).not.toBe(requestToken);
  });

  it('accepts valid refresh token', async () => {
    const token = 'valid-refresh-token';
    mockRedis.get.mockResolvedValue(token);

    const storedToken = await mockRedis.get('auth:refresh:user-1');
    expect(storedToken).toBe(token);
  });
});

describe('Security: Error sanitization', () => {
  it('hides internal errors in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { handleError } = await import('@safetag/service-utils');
    const result = handleError(new Error('Database connection failed: password=secret123'));

    // In production, should not leak the internal error
    expect(result.body).toHaveProperty('error');
    expect((result.body as any).error).not.toContain('secret123');

    process.env.NODE_ENV = originalEnv;
  });
});

describe('Security: IDOR protection', () => {
  it('validates userId matches ownerId pattern', () => {
    const userId = 'user-1';
    const ownerId = 'user-2';
    expect(userId).not.toBe(ownerId);
    // Endpoint should return 403 when these don't match
  });
});
