import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../generated/prisma/index.js', () => {
  const mockPrisma = {
    dndConfig: { findUnique: vi.fn() },
    queuedMessage: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  };
  return { PrismaClient: class { constructor() { return mockPrisma; } } };
});

vi.mock('@safetag/service-utils', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
}));

vi.mock('../whatsapp.js', () => ({
  notifyOwner: vi.fn().mockResolvedValue({ success: true }),
}));

const { PrismaClient } = await import('../../generated/prisma/index.js');
const prisma = new PrismaClient() as any;

const { isDndActive, queueMessage } = await import('../services/dnd.js');

beforeEach(() => vi.clearAllMocks());

describe('isDndActive', () => {
  it('returns false when no DND config exists', async () => {
    prisma.dndConfig.findUnique.mockResolvedValue(null);
    expect(await isDndActive('user-1')).toBe(false);
  });

  it('returns false when DND is disabled', async () => {
    prisma.dndConfig.findUnique.mockResolvedValue({
      userId: 'user-1',
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
    });
    expect(await isDndActive('user-1')).toBe(false);
  });

  it('returns true during overnight DND window', async () => {
    const now = new Date();
    // Set a DND window that includes the current time
    const currentHour = now.getHours();
    const startTime = `${(currentHour - 1 + 24) % 24}:00`;
    const endTime = `${(currentHour + 1) % 24}:00`;

    prisma.dndConfig.findUnique.mockResolvedValue({
      userId: 'user-1',
      enabled: true,
      startTime,
      endTime,
    });

    expect(await isDndActive('user-1')).toBe(true);
  });

  it('returns false outside DND window', async () => {
    const now = new Date();
    const currentHour = now.getHours();
    // Set window to NOT include current time
    const startTime = `${(currentHour + 2) % 24}:00`;
    const endTime = `${(currentHour + 4) % 24}:00`;

    prisma.dndConfig.findUnique.mockResolvedValue({
      userId: 'user-1',
      enabled: true,
      startTime,
      endTime,
    });

    expect(await isDndActive('user-1')).toBe(false);
  });
});

describe('queueMessage', () => {
  it('creates a queued message record', async () => {
    prisma.dndConfig.findUnique.mockResolvedValue({
      userId: 'user-1',
      endTime: '07:00',
    });
    prisma.queuedMessage.create.mockResolvedValue({});

    await queueMessage('user-1', 'Hello owner', 'WHATSAPP', { problemType: 'LIGHTS_ON' });

    expect(prisma.queuedMessage.create).toHaveBeenCalledTimes(1);
    const call = prisma.queuedMessage.create.mock.calls[0][0];
    expect(call.data.userId).toBe('user-1');
    expect(call.data.content).toBe('Hello owner');
    expect(call.data.channel).toBe('WHATSAPP');
  });
});
