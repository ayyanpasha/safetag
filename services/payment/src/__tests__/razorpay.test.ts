import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import { verifyWebhookSignature } from '../services/razorpay.js';

const WEBHOOK_SECRET = 'test-webhook-secret';

beforeAll(() => {
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
});

describe('verifyWebhookSignature', () => {
  it('returns true for valid signature', () => {
    const body = JSON.stringify({ event: 'subscription.activated', payload: {} });
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  it('returns false for invalid signature', () => {
    const body = JSON.stringify({ event: 'test' });
    const badSig = crypto
      .createHmac('sha256', 'wrong-secret')
      .update(body)
      .digest('hex');

    expect(verifyWebhookSignature(body, badSig)).toBe(false);
  });

  it('detects tampered body', () => {
    const body = JSON.stringify({ event: 'test' });
    const signature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    const tamperedBody = JSON.stringify({ event: 'tampered' });
    expect(verifyWebhookSignature(tamperedBody, signature)).toBe(false);
  });
});
