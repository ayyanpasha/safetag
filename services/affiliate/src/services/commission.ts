import { PrismaClient } from '../../generated/prisma/index.js';
import { createLogger, subscribeToEvent } from '@safetag/service-utils';
import { EVENTS } from '@safetag/shared-types';

const prisma = new PrismaClient();
const logger = createLogger('affiliate-commission');

/**
 * Calculate commission based on payment number and amount.
 * - Payment 1: 20%
 * - Payment 2-3: 10%
 * - Payment 4+: 0%
 */
export function calculateCommission(paymentNumber: number, amount: number): { percent: number; commission: number } {
  if (paymentNumber === 1) {
    return { percent: 20, commission: Math.round(amount * 0.2) };
  }
  if (paymentNumber === 2 || paymentNumber === 3) {
    return { percent: 10, commission: Math.round(amount * 0.1) };
  }
  return { percent: 0, commission: 0 };
}

interface SubscriptionActivatedPayload {
  userId: string;
  subscriptionId: string;
  amount: number;
  dealerCode?: string;
  paymentNumber?: number;
}

/**
 * Subscribe to SUBSCRIPTION_ACTIVATED events from Redis.
 * When a subscription payment comes in for a referred user, create/update referral records.
 */
export function startCommissionListener(): void {
  const eventName = EVENTS?.SUBSCRIPTION_ACTIVATED || 'subscription:activated';

  subscribeToEvent(eventName, async (payload: unknown) => {
    try {
      const data = payload as SubscriptionActivatedPayload;

      if (!data.userId || !data.subscriptionId || !data.amount) {
        logger.warn({ data }, 'Invalid SUBSCRIPTION_ACTIVATED payload');
        return;
      }

      // Check if this user was referred by a dealer
      const existingReferral = await prisma.referral.findFirst({
        where: { referredUserId: data.userId },
        orderBy: { createdAt: 'desc' },
      });

      if (!existingReferral) {
        // No referral record for this user — not a referred user
        return;
      }

      const paymentNumber = data.paymentNumber || (existingReferral.paymentNumber + 1);
      const { percent, commission } = calculateCommission(paymentNumber, data.amount);

      if (commission > 0) {
        await prisma.referral.create({
          data: {
            dealerId: existingReferral.dealerId,
            referredUserId: data.userId,
            subscriptionId: data.subscriptionId,
            commissionPercent: percent,
            commissionAmount: commission,
            paymentNumber,
            status: 'PENDING',
          },
        });

        logger.info(
          { dealerId: existingReferral.dealerId, userId: data.userId, paymentNumber, commission },
          'Commission referral created',
        );
      }
    } catch (err) {
      logger.error({ err }, 'Error processing SUBSCRIPTION_ACTIVATED event');
    }
  });

  logger.info(`Listening for ${eventName} events`);
}
