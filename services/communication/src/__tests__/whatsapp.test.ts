import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@safetag/service-utils', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { sendScannerThankYou, notifyOwner } from '../services/whatsapp.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendScannerThankYou', () => {
  it('returns success in simulated mode', async () => {
    const result = await sendScannerThankYou('+919999999999', 'parking', 'en');
    expect(result.success).toBe(true);
    expect(result.messageId).toContain('sim_');
  });

  it('supports Hindi language', async () => {
    const result = await sendScannerThankYou('+919999999999', 'parking', 'hi');
    expect(result.success).toBe(true);
  });

  it('falls back to English for unknown language', async () => {
    const result = await sendScannerThankYou('+919999999999', 'parking', 'fr');
    expect(result.success).toBe(true);
  });
});

describe('notifyOwner', () => {
  it('returns success in simulated mode', async () => {
    const result = await notifyOwner('owner-1', 'Test message');
    expect(result.success).toBe(true);
    expect(result.messageId).toContain('sim_');
  });

  it('accepts metadata parameter', async () => {
    const result = await notifyOwner('owner-1', 'Test message', { conversationId: 'conv-1' });
    expect(result.success).toBe(true);
  });
});
