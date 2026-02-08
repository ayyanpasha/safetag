import { prisma } from '../lib/prisma.js';
import { publishEvent, EVENTS } from '../lib/redis.js';
import { verifyHmacSignature } from '../lib/crypto.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../middleware/error-handler.js';
import Razorpay from 'razorpay';

// Plan configuration - each plan covers 1 vehicle only
export const PLAN_CONFIG = {
  MONTHLY: {
    price: 299,
    duration: 1,
    vehicleLimit: 1,
    razorpayPlanId: process.env.RAZORPAY_PLAN_MONTHLY,
  },
  QUARTERLY: {
    price: 499,
    duration: 3,
    vehicleLimit: 1,
    razorpayPlanId: process.env.RAZORPAY_PLAN_QUARTERLY,
  },
  SEMI_ANNUAL: {
    price: 699,
    duration: 6,
    vehicleLimit: 1,
    razorpayPlanId: process.env.RAZORPAY_PLAN_SEMI_ANNUAL,
  },
  YEARLY: {
    price: 999,
    duration: 12,
    vehicleLimit: 1,
    razorpayPlanId: process.env.RAZORPAY_PLAN_YEARLY,
  },
} as const;

// Price for additional vehicles (in paise)
export const EXTRA_VEHICLE_PRICE = 9900; // ₹99 per extra vehicle

export type PlanType = keyof typeof PLAN_CONFIG;

export interface SubscriptionInfo {
  id: string;
  plan: string;
  status: string;
  vehicleLimit: number;
  additionalVehicles: number;
  totalVehicleLimit: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
}

export interface PlanInfo {
  name: string;
  price: number;
  duration: number;
  vehicleLimit: number;
}

// Initialize Razorpay client
function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// Get available plans
export function getPlans(): Record<string, PlanInfo> {
  return Object.entries(PLAN_CONFIG).reduce(
    (acc, [key, value]) => {
      acc[key] = {
        name: key,
        price: value.price,
        duration: value.duration,
        vehicleLimit: value.vehicleLimit,
      };
      return acc;
    },
    {} as Record<string, PlanInfo>
  );
}

// Get user's subscription
export async function getUserSubscription(
  userId: string
): Promise<SubscriptionInfo | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    plan: subscription.plan,
    status: subscription.status,
    vehicleLimit: subscription.vehicleLimit,
    additionalVehicles: subscription.additionalVehicles,
    totalVehicleLimit: subscription.vehicleLimit + subscription.additionalVehicles,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    createdAt: subscription.createdAt,
  };
}

// Create new subscription
export async function createSubscription(
  userId: string,
  plan: PlanType
): Promise<{
  subscriptionId: string;
  razorpaySubscriptionId: string;
  shortUrl: string;
}> {
  // Check if user already has active subscription
  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (existing && existing.status === 'ACTIVE') {
    throw new ForbiddenError('You already have an active subscription');
  }

  const planConfig = PLAN_CONFIG[plan];

  if (!planConfig.razorpayPlanId) {
    throw new ValidationError(`Plan ${plan} is not configured`);
  }

  const razorpay = getRazorpayClient();

  // Create Razorpay subscription
  const razorpaySubscription = await razorpay.subscriptions.create({
    plan_id: planConfig.razorpayPlanId,
    customer_notify: 1,
    total_count: 12, // Allow up to 12 billing cycles
    notes: {
      userId,
      plan,
    },
  });

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + planConfig.duration);

  // Create or update local subscription
  const subscription = await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status: 'TRIALING',
      razorpaySubId: razorpaySubscription.id,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      vehicleLimit: 1,
      additionalVehicles: 0,
    },
    update: {
      plan,
      status: 'TRIALING',
      razorpaySubId: razorpaySubscription.id,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      vehicleLimit: 1,
      // Keep existing additionalVehicles when changing plan
    },
  });

  return {
    subscriptionId: subscription.id,
    razorpaySubscriptionId: razorpaySubscription.id,
    shortUrl: razorpaySubscription.short_url,
  };
}

// Verify Razorpay webhook signature (A08 Data Integrity)
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Razorpay webhook secret not configured');
    return false;
  }

  return verifyHmacSignature(payload, signature, webhookSecret);
}

// Process webhook event
export async function processWebhookEvent(
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const entity = payload.payload as Record<string, unknown>;

  switch (event) {
    case 'subscription.activated': {
      await handleSubscriptionActivated(entity);
      break;
    }
    case 'subscription.charged': {
      await handleSubscriptionCharged(entity);
      break;
    }
    case 'subscription.cancelled': {
      await handleSubscriptionCancelled(entity);
      break;
    }
    case 'payment.captured': {
      await handlePaymentCaptured(entity);
      break;
    }
    default:
      console.log(`Unhandled webhook event: ${event}`);
  }
}

// Handle subscription activated
async function handleSubscriptionActivated(
  entity: Record<string, unknown>
): Promise<void> {
  const subscription = entity.subscription as Record<string, unknown>;
  const razorpaySubId = subscription.entity as Record<string, unknown>;
  const subId = razorpaySubId.id as string;

  const localSub = await prisma.subscription.findFirst({
    where: { razorpaySubId: subId },
  });

  if (!localSub) {
    console.error(`Subscription not found: ${subId}`);
    return;
  }

  await prisma.subscription.update({
    where: { id: localSub.id },
    data: { status: 'ACTIVE' },
  });

  // Publish event for affiliate commission
  await publishEvent(EVENTS.SUBSCRIPTION_ACTIVATED, {
    userId: localSub.userId,
    subscriptionId: localSub.id,
    plan: localSub.plan,
    isFirstPayment: true,
  });
}

// Handle subscription charged (recurring payment)
async function handleSubscriptionCharged(
  entity: Record<string, unknown>
): Promise<void> {
  const subscription = entity.subscription as Record<string, unknown>;
  const payment = entity.payment as Record<string, unknown>;

  const razorpaySubEntity = subscription.entity as Record<string, unknown>;
  const paymentEntity = payment.entity as Record<string, unknown>;

  const subId = razorpaySubEntity.id as string;

  const localSub = await prisma.subscription.findFirst({
    where: { razorpaySubId: subId },
  });

  if (!localSub) {
    console.error(`Subscription not found: ${subId}`);
    return;
  }

  const planConfig = PLAN_CONFIG[localSub.plan as PlanType];

  // Extend period
  const newPeriodEnd = new Date(localSub.currentPeriodEnd);
  newPeriodEnd.setMonth(newPeriodEnd.getMonth() + planConfig.duration);

  await prisma.subscription.update({
    where: { id: localSub.id },
    data: {
      status: 'ACTIVE',
      currentPeriodStart: localSub.currentPeriodEnd,
      currentPeriodEnd: newPeriodEnd,
    },
  });

  // Record payment
  await prisma.payment.create({
    data: {
      subscriptionId: localSub.id,
      razorpayPaymentId: paymentEntity.id as string,
      razorpayOrderId: paymentEntity.order_id as string,
      amount: paymentEntity.amount as number,
      currency: (paymentEntity.currency as string) || 'INR',
      status: 'captured',
    },
  });

  // Count payments for this subscription
  const paymentCount = await prisma.payment.count({
    where: { subscriptionId: localSub.id },
  });

  // Publish event for affiliate commission
  await publishEvent(EVENTS.SUBSCRIPTION_ACTIVATED, {
    userId: localSub.userId,
    subscriptionId: localSub.id,
    plan: localSub.plan,
    paymentNumber: paymentCount,
    isFirstPayment: false,
  });
}

// Handle subscription cancelled
async function handleSubscriptionCancelled(
  entity: Record<string, unknown>
): Promise<void> {
  const subscription = entity.subscription as Record<string, unknown>;
  const razorpaySubEntity = subscription.entity as Record<string, unknown>;
  const subId = razorpaySubEntity.id as string;

  const localSub = await prisma.subscription.findFirst({
    where: { razorpaySubId: subId },
  });

  if (!localSub) {
    console.error(`Subscription not found: ${subId}`);
    return;
  }

  await prisma.subscription.update({
    where: { id: localSub.id },
    data: { status: 'CANCELED' },
  });

  await publishEvent(EVENTS.SUBSCRIPTION_CANCELED, {
    userId: localSub.userId,
    subscriptionId: localSub.id,
  });
}

// Handle payment captured
async function handlePaymentCaptured(
  entity: Record<string, unknown>
): Promise<void> {
  const payment = entity.payment as Record<string, unknown>;
  const paymentEntity = payment.entity as Record<string, unknown>;

  // This might be a one-time payment, handle accordingly
  console.log(`Payment captured: ${paymentEntity.id}`);
}

// Cancel subscription
export async function cancelSubscription(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new NotFoundError('Subscription not found');
  }

  if (subscription.status === 'CANCELED') {
    throw new ValidationError('Subscription already cancelled');
  }

  if (subscription.razorpaySubId) {
    const razorpay = getRazorpayClient();

    await razorpay.subscriptions.cancel(subscription.razorpaySubId);
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'CANCELED' },
  });
}

// Get payment history
export async function getPaymentHistory(
  userId: string
): Promise<
  Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
  }>
> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return [];
  }

  const payments = await prisma.payment.findMany({
    where: { subscriptionId: subscription.id },
    orderBy: { createdAt: 'desc' },
  });

  return payments.map((p) => ({
    id: p.id,
    amount: p.amount / 100, // Convert from paise to rupees
    currency: p.currency,
    status: p.status,
    createdAt: p.createdAt,
  }));
}

// Get extra vehicle price info
export function getExtraVehiclePrice(): {
  price: number;
  currency: string;
  description: string;
} {
  return {
    price: EXTRA_VEHICLE_PRICE / 100, // Convert from paise to rupees
    currency: 'INR',
    description: 'Add one additional vehicle slot to your subscription',
  };
}

// Create order for extra vehicle purchase
export async function createExtraVehicleOrder(
  userId: string,
  quantity: number = 1
): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}> {
  // Check if user has active subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.status !== 'ACTIVE') {
    throw new ForbiddenError('You need an active subscription to add extra vehicles');
  }

  if (quantity < 1 || quantity > 10) {
    throw new ValidationError('Quantity must be between 1 and 10');
  }

  // Move Razorpay client initialization after validation
  const razorpay = getRazorpayClient();
  const amount = EXTRA_VEHICLE_PRICE * quantity;

  // Create Razorpay order
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `extra_vehicle_${userId}_${Date.now()}`,
    notes: {
      userId,
      subscriptionId: subscription.id,
      type: 'extra_vehicle',
      quantity: quantity.toString(),
    },
  });

  // Create pending vehicle purchase record
  await prisma.vehiclePurchase.create({
    data: {
      subscriptionId: subscription.id,
      razorpayOrderId: order.id,
      amount,
      status: 'pending',
    },
  });

  return {
    orderId: order.id,
    amount: amount / 100, // Convert to rupees for display
    currency: 'INR',
    key: process.env.RAZORPAY_KEY_ID || '',
  };
}

// Verify and complete extra vehicle purchase
export async function verifyExtraVehiclePurchase(
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<{
  success: boolean;
  newVehicleLimit: number;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new NotFoundError('Subscription not found');
  }

  // Find the pending purchase
  const purchase = await prisma.vehiclePurchase.findFirst({
    where: {
      subscriptionId: subscription.id,
      razorpayOrderId,
      status: 'pending',
    },
  });

  if (!purchase) {
    throw new NotFoundError('Purchase order not found');
  }

  // Verify signature
  const razorpay = getRazorpayClient();
  const crypto = await import('crypto');
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (generatedSignature !== razorpaySignature) {
    throw new ValidationError('Invalid payment signature');
  }

  // Get quantity from the order notes
  const order = await razorpay.orders.fetch(razorpayOrderId);
  const quantity = parseInt((order.notes as Record<string, string>)?.quantity || '1', 10);

  // Update purchase and subscription in a transaction
  await prisma.$transaction([
    prisma.vehiclePurchase.update({
      where: { id: purchase.id },
      data: {
        razorpayPaymentId,
        status: 'completed',
      },
    }),
    prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        additionalVehicles: {
          increment: quantity,
        },
      },
    }),
  ]);

  // Get updated subscription
  const updatedSub = await prisma.subscription.findUnique({
    where: { id: subscription.id },
  });

  return {
    success: true,
    newVehicleLimit: (updatedSub?.vehicleLimit || 1) + (updatedSub?.additionalVehicles || 0),
  };
}

// Get vehicle purchase history
export async function getVehiclePurchaseHistory(
  userId: string
): Promise<
  Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
  }>
> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return [];
  }

  const purchases = await prisma.vehiclePurchase.findMany({
    where: { subscriptionId: subscription.id },
    orderBy: { createdAt: 'desc' },
  });

  return purchases.map((p) => ({
    id: p.id,
    amount: p.amount / 100, // Convert from paise to rupees
    currency: p.currency,
    status: p.status,
    createdAt: p.createdAt,
  }));
}
