import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import type { PlanType } from '@safetag/shared-types';
import { createLogger } from '@safetag/service-utils';

const logger = createLogger('razorpay');

let razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpay) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpay = new Razorpay({ key_id, key_secret });
  }
  return razorpay;
}

const PLAN_ID_MAP: Record<PlanType, string> = {
  MONTHLY: process.env.RAZORPAY_PLAN_MONTHLY || '',
  QUARTERLY: process.env.RAZORPAY_PLAN_QUARTERLY || '',
  SEMI_ANNUAL: process.env.RAZORPAY_PLAN_SEMI_ANNUAL || '',
  YEARLY: process.env.RAZORPAY_PLAN_YEARLY || '',
};

export async function createSubscription(
  plan: PlanType,
  userId: string,
  phone: string,
): Promise<{ subscriptionId: string; shortUrl: string }> {
  const planId = PLAN_ID_MAP[plan];
  if (!planId) {
    throw new Error(`Razorpay plan ID not configured for plan: ${plan}`);
  }

  logger.info({ plan, userId }, 'Creating Razorpay subscription');

  const subscription = await getRazorpay().subscriptions.create({
    plan_id: planId,
    total_count: 12,
    quantity: 1,
    notes: {
      userId,
      plan,
    },
    notify_info: {
      notify_phone: phone,
    },
  } as any);

  return {
    subscriptionId: subscription.id,
    shortUrl: (subscription as any).short_url,
  };
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signature, 'hex'),
  );
}
