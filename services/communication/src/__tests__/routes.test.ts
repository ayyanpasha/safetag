import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { registerRoutes } from '../routes.js';

vi.mock('../../generated/prisma/index.js', () => {
  const mockPrisma = {
    conversation: { create: vi.fn(), findMany: vi.fn() },
    message: { create: vi.fn() },
    dndConfig: { findUnique: vi.fn() },
    queuedMessage: { create: vi.fn() },
  };
  return { PrismaClient: class { constructor() { return mockPrisma; } } };
});

vi.mock('@safetag/service-utils', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  handleError: (err: any) => ({
    statusCode: err.statusCode || 500,
    body: { success: false, error: err.message },
  }),
  ValidationError: class extends Error {
    statusCode = 400;
    constructor(msg = 'Validation failed') { super(msg); }
  },
  UnauthorizedError: class extends Error {
    statusCode = 401;
    constructor(msg = 'Unauthorized') { super(msg); }
  },
  decryptSessionToken: vi.fn((token: string) => {
    if (token === 'valid-session') {
      return {
        scannerSessionId: 'scan-1',
        ownerId: 'owner-1',
        ownerPhone: '+919876543210',
        vehicleId: 'v-1',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1800000).toISOString(),
      };
    }
    throw new Error('Invalid token');
  }),
}));

vi.mock('../services/whatsapp.js', () => ({
  sendScannerThankYou: vi.fn().mockResolvedValue(undefined),
  notifyOwner: vi.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
}));

vi.mock('../services/dnd.js', () => ({
  isDndActive: vi.fn().mockResolvedValue(false),
  queueMessage: vi.fn().mockResolvedValue(undefined),
}));

const { PrismaClient } = await import('../../generated/prisma/index.js');
const prisma = new PrismaClient() as any;

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function buildApp() {
  const app = Fastify();
  registerRoutes(app);
  return app;
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/contact/whatsapp/complaint', () => {
  it('sends complaint and creates conversation', async () => {
    prisma.conversation.create.mockResolvedValue({ id: 'conv-1' });
    prisma.message.create.mockResolvedValue({});

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contact/whatsapp/complaint',
      payload: {
        sessionToken: 'valid-session',
        problemType: 'WRONG_PARKING',
        language: 'en',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().success).toBe(true);
    expect(res.json().conversationId).toBe('conv-1');
  });

  it('returns 401 for invalid session token', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contact/whatsapp/complaint',
      payload: {
        sessionToken: 'bad-token',
        problemType: 'WRONG_PARKING',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('queues message when DND is active', async () => {
    const { isDndActive } = await import('../services/dnd.js');
    (isDndActive as any).mockResolvedValue(true);

    prisma.conversation.create.mockResolvedValue({ id: 'conv-2' });
    prisma.message.create.mockResolvedValue({});

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contact/whatsapp/complaint',
      payload: {
        sessionToken: 'valid-session',
        problemType: 'LIGHTS_ON',
      },
    });

    expect(res.statusCode).toBe(200);
    const { queueMessage } = await import('../services/dnd.js');
    expect(queueMessage).toHaveBeenCalled();
  });
});

describe('POST /api/contact/voip/initiate', () => {
  it('returns 401 for invalid session token', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contact/voip/initiate',
      payload: {
        sessionToken: 'bad-token',
        phone: '+919876543210',
        otp: '123456',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('returns 403 when owner has DND active for VoIP', async () => {
    const { isDndActive } = await import('../services/dnd.js');
    (isDndActive as any).mockResolvedValue(true);

    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/contact/voip/initiate',
      payload: {
        sessionToken: 'valid-session',
        phone: '+919876543210',
        otp: '123456',
      },
    });

    expect(res.statusCode).toBe(403);
  });
});
