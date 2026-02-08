import { prisma } from '../lib/prisma.js';
import { subscribeToEvent, EVENTS } from '../lib/redis.js';
import { nanoid } from 'nanoid';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../middleware/error-handler.js';

const DEALER_CODE_PREFIX = 'ST';
const DEALER_CODE_LENGTH = 6;

// Commission percentages by payment number
const COMMISSION_RATES: Record<number, number> = {
  1: 20, // First payment: 20%
  2: 10, // Second payment: 10%
  3: 10, // Third payment: 10%
  // 4+: 0%
};

export interface DealerInfo {
  id: string;
  dealerCode: string;
  businessName: string;
  isApproved: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingEarnings: number;
  paidEarnings: number;
  lifetimeEarnings: number;
}

export interface ReferralInfo {
  id: string;
  referredUserId: string;
  commissionPercent: number;
  commissionAmount: number;
  paymentNumber: number;
  status: string;
  createdAt: Date;
}

export interface PayoutInfo {
  id: string;
  amount: number;
  status: string;
  processedAt: Date | null;
  createdAt: Date;
}

// Generate unique dealer code
async function generateDealerCode(): Promise<string> {
  let code: string;
  let exists = true;

  while (exists) {
    code = `${DEALER_CODE_PREFIX}-${nanoid(DEALER_CODE_LENGTH).toUpperCase()}`;
    const existing = await prisma.dealer.findUnique({
      where: { dealerCode: code },
    });
    exists = !!existing;
  }

  return code!;
}

// Get commission rate for payment number
function getCommissionRate(paymentNumber: number): number {
  return COMMISSION_RATES[paymentNumber] || 0;
}

// Register as dealer
export async function registerDealer(
  userId: string,
  businessName: string
): Promise<DealerInfo> {
  // Check if user is already a dealer
  const existing = await prisma.dealer.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new ConflictError('You are already registered as a dealer');
  }

  // Check user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Update user role to DEALER
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'DEALER' },
  });

  // Create dealer record
  const dealerCode = await generateDealerCode();

  const dealer = await prisma.dealer.create({
    data: {
      userId,
      dealerCode,
      businessName,
      isApproved: false, // Requires admin approval
    },
  });

  return {
    id: dealer.id,
    dealerCode: dealer.dealerCode,
    businessName: dealer.businessName,
    isApproved: dealer.isApproved,
    createdAt: dealer.createdAt,
  };
}

// Get dealer dashboard stats
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const dealer = await prisma.dealer.findUnique({
    where: { userId },
  });

  if (!dealer) {
    throw new NotFoundError('Dealer profile not found');
  }

  const referrals = await prisma.referral.findMany({
    where: { dealerId: dealer.id },
  });

  const pendingEarnings = referrals
    .filter((r) => r.status === 'PENDING')
    .reduce((sum, r) => sum + r.commissionAmount, 0);

  const paidEarnings = referrals
    .filter((r) => r.status === 'PAID')
    .reduce((sum, r) => sum + r.commissionAmount, 0);

  return {
    totalReferrals: referrals.length,
    activeReferrals: referrals.filter((r) => r.status === 'PENDING').length,
    pendingEarnings: pendingEarnings / 100, // Convert to rupees
    paidEarnings: paidEarnings / 100,
    lifetimeEarnings: (pendingEarnings + paidEarnings) / 100,
  };
}

// Get dealer referrals
export async function getDealerReferrals(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ referrals: ReferralInfo[]; total: number }> {
  const dealer = await prisma.dealer.findUnique({
    where: { userId },
  });

  if (!dealer) {
    throw new NotFoundError('Dealer profile not found');
  }

  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.referral.count({
      where: { dealerId: dealer.id },
    }),
  ]);

  return {
    referrals: referrals.map((r) => ({
      id: r.id,
      referredUserId: r.referredUserId,
      commissionPercent: r.commissionPercent,
      commissionAmount: r.commissionAmount / 100,
      paymentNumber: r.paymentNumber,
      status: r.status,
      createdAt: r.createdAt,
    })),
    total,
  };
}

// Apply referral code (on new user signup)
export async function applyReferralCode(
  userId: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const dealer = await prisma.dealer.findUnique({
    where: { dealerCode: code },
  });

  if (!dealer) {
    throw new NotFoundError('Invalid referral code');
  }

  if (!dealer.isApproved) {
    throw new ForbiddenError('This dealer is not yet approved');
  }

  // Check if user already has a referral
  const existingReferral = await prisma.referral.findFirst({
    where: { referredUserId: userId },
  });

  if (existingReferral) {
    throw new ConflictError('You have already used a referral code');
  }

  // Create pending referral (commission will be calculated on subscription)
  await prisma.referral.create({
    data: {
      dealerId: dealer.id,
      referredUserId: userId,
      commissionPercent: COMMISSION_RATES[1],
      commissionAmount: 0, // Will be set on subscription
      paymentNumber: 1,
      status: 'PENDING',
    },
  });

  return {
    success: true,
    message: 'Referral code applied successfully',
  };
}

// Get dealer payouts
export async function getDealerPayouts(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ payouts: PayoutInfo[]; total: number }> {
  const dealer = await prisma.dealer.findUnique({
    where: { userId },
  });

  if (!dealer) {
    throw new NotFoundError('Dealer profile not found');
  }

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.payout.count({
      where: { dealerId: dealer.id },
    }),
  ]);

  return {
    payouts: payouts.map((p) => ({
      id: p.id,
      amount: p.amount / 100,
      status: p.status,
      processedAt: p.processedAt,
      createdAt: p.createdAt,
    })),
    total,
  };
}

// Request payout
export async function requestPayout(
  userId: string,
  amount: number
): Promise<PayoutInfo> {
  const dealer = await prisma.dealer.findUnique({
    where: { userId },
  });

  if (!dealer) {
    throw new NotFoundError('Dealer profile not found');
  }

  if (!dealer.isApproved) {
    throw new ForbiddenError('Dealer account is not approved');
  }

  // Check available balance
  const stats = await getDashboardStats(userId);
  const requestedAmount = amount * 100; // Convert to paise

  if (requestedAmount > stats.pendingEarnings * 100) {
    throw new ValidationError('Insufficient pending earnings');
  }

  // Create payout request
  const payout = await prisma.payout.create({
    data: {
      dealerId: dealer.id,
      amount: requestedAmount,
      status: 'PENDING',
    },
  });

  // Mark referrals as PAID (up to the requested amount)
  let remainingAmount = requestedAmount;
  const pendingReferrals = await prisma.referral.findMany({
    where: {
      dealerId: dealer.id,
      status: 'PENDING',
      commissionAmount: { gt: 0 },
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const referral of pendingReferrals) {
    if (remainingAmount <= 0) break;

    if (referral.commissionAmount <= remainingAmount) {
      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'PAID' },
      });
      remainingAmount -= referral.commissionAmount;
    }
  }

  return {
    id: payout.id,
    amount: payout.amount / 100,
    status: payout.status,
    processedAt: payout.processedAt,
    createdAt: payout.createdAt,
  };
}

// Handle subscription payment (calculate commission)
async function handleSubscriptionPayment(payload: {
  userId: string;
  subscriptionId: string;
  plan: string;
  paymentNumber?: number;
  isFirstPayment: boolean;
}): Promise<void> {
  const paymentNumber = payload.paymentNumber || (payload.isFirstPayment ? 1 : 2);
  const commissionRate = getCommissionRate(paymentNumber);

  if (commissionRate === 0) {
    // No commission for this payment
    return;
  }

  // Find referral for this user
  const referral = await prisma.referral.findFirst({
    where: {
      referredUserId: payload.userId,
      paymentNumber: paymentNumber,
    },
  });

  if (!referral && payload.isFirstPayment) {
    // First payment - check if there's a pending referral (from code application)
    const pendingReferral = await prisma.referral.findFirst({
      where: {
        referredUserId: payload.userId,
        status: 'PENDING',
        commissionAmount: 0,
      },
    });

    if (pendingReferral) {
      // Get subscription amount
      const subscription = await prisma.subscription.findUnique({
        where: { id: payload.subscriptionId },
      });

      if (subscription) {
        const planPrices: Record<string, number> = {
          MONTHLY: 29900,
          QUARTERLY: 49900,
          SEMI_ANNUAL: 69900,
          YEARLY: 99900,
        };

        const planPrice = planPrices[payload.plan] || 29900;
        const commissionAmount = Math.floor((planPrice * commissionRate) / 100);

        await prisma.referral.update({
          where: { id: pendingReferral.id },
          data: {
            subscriptionId: payload.subscriptionId,
            commissionAmount,
          },
        });
      }
    }
  } else if (referral && paymentNumber > 1) {
    // Subsequent payment - create new referral record
    const subscription = await prisma.subscription.findUnique({
      where: { id: payload.subscriptionId },
    });

    if (subscription) {
      const planPrices: Record<string, number> = {
        MONTHLY: 29900,
        QUARTERLY: 49900,
        SEMI_ANNUAL: 69900,
        YEARLY: 99900,
      };

      const planPrice = planPrices[payload.plan] || 29900;
      const commissionAmount = Math.floor((planPrice * commissionRate) / 100);

      await prisma.referral.create({
        data: {
          dealerId: referral.dealerId,
          referredUserId: payload.userId,
          subscriptionId: payload.subscriptionId,
          commissionPercent: commissionRate,
          commissionAmount,
          paymentNumber,
          status: 'PENDING',
        },
      });
    }
  }
}

// Initialize event listeners
export function initAffiliateEventListeners(): void {
  subscribeToEvent<{
    userId: string;
    subscriptionId: string;
    plan: string;
    paymentNumber?: number;
    isFirstPayment: boolean;
  }>(EVENTS.SUBSCRIPTION_ACTIVATED, handleSubscriptionPayment);
}

// Get dealer by code (for validation)
export async function getDealerByCode(code: string): Promise<{
  id: string;
  businessName: string;
  isApproved: boolean;
} | null> {
  const dealer = await prisma.dealer.findUnique({
    where: { dealerCode: code },
    select: {
      id: true,
      businessName: true,
      isApproved: true,
    },
  });

  return dealer;
}

// Approve dealer (admin only)
export async function approveDealer(dealerId: string): Promise<void> {
  await prisma.dealer.update({
    where: { id: dealerId },
    data: { isApproved: true },
  });
}
