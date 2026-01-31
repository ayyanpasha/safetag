import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────
export const PlanType = z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'YEARLY']);
export type PlanType = z.infer<typeof PlanType>;

export const SubStatus = z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING']);
export type SubStatus = z.infer<typeof SubStatus>;

export const TagType = z.enum(['VEHICLE']);
export type TagType = z.infer<typeof TagType>;

export const UserRole = z.enum(['OWNER', 'DEALER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRole>;

export const ScanAction = z.enum(['VIEW', 'WHATSAPP', 'VOIP_CALL', 'EMERGENCY']);
export type ScanAction = z.infer<typeof ScanAction>;

export const EmergencyType = z.enum([
  'ACCIDENT',
  'CAR_CRASH',
  'THEFT',
  'VANDALISM',
  'FIRE',
  'OTHER',
]);
export type EmergencyType = z.infer<typeof EmergencyType>;

export const ProblemType = z.enum([
  'WRONG_PARKING',
  'GETTING_TOWED',
  'LIGHTS_ON',
  'BLOCKING_DRIVEWAY',
  'ALARM_GOING_OFF',
  'DOOR_OPEN',
  'OTHER',
]);
export type ProblemType = z.infer<typeof ProblemType>;

// ─── Schemas ─────────────────────────────────────────────

export const PhoneSchema = z.string().regex(/^\+91[6-9]\d{9}$/, 'Invalid Indian phone number');

export const VehicleNumberSchema = z
  .string()
  .min(4)
  .max(15)
  .regex(/^[A-Z0-9]+$/, 'Vehicle number must be uppercase alphanumeric, no spaces');

export const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Location = z.infer<typeof LocationSchema>;

export const OtpSendSchema = z.object({
  phone: PhoneSchema,
});

export const OtpVerifySchema = z.object({
  phone: PhoneSchema,
  otp: z.string().length(6),
});

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  phone: z.string(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
  role: UserRole,
  emergencyContact: z.string().nullable(),
  dndEnabled: z.boolean(),
  dndStart: z.string().nullable(),
  dndEnd: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const CreateVehicleSchema = z.object({
  vehicleNumber: VehicleNumberSchema,
  make: z.string().min(1).max(50).optional(),
  model: z.string().min(1).max(50).optional(),
  color: z.string().min(1).max(30).optional(),
});

export const VehicleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  vehicleNumber: z.string(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  color: z.string().nullable(),
  qrCode: z.string(),
  qrShortCode: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});
export type Vehicle = z.infer<typeof VehicleSchema>;

export const ScanInitSchema = z.object({
  vehicleNumber: VehicleNumberSchema,
  location: LocationSchema,
});

export const SessionTokenPayload = z.object({
  vehicleNumber: z.string(),
  lat: z.number(),
  lng: z.number(),
  ownerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  exp: z.number(),
});
export type SessionTokenPayload = z.infer<typeof SessionTokenPayload>;

export const WhatsAppComplaintSchema = z.object({
  sessionToken: z.string(),
  problemType: ProblemType,
  language: z.string().default('en'),
});

export const VoipCallSchema = z.object({
  sessionToken: z.string(),
  phone: PhoneSchema,
  otp: z.string().length(6),
});

export const EmergencyReportSchema = z.object({
  sessionToken: z.string(),
  phone: PhoneSchema,
  otp: z.string().length(6),
  emergencyType: EmergencyType,
  // photo is sent as multipart
});

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  plan: PlanType,
  status: SubStatus,
  razorpaySubId: z.string().nullable(),
  razorpayCustomerId: z.string().nullable(),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  vehicleLimit: z.number(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const AffiliateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  dealerCode: z.string(),
  isApproved: z.boolean(),
  totalReferrals: z.number(),
  totalEarnings: z.number(),
});
export type Affiliate = z.infer<typeof AffiliateSchema>;

// ─── API Response ────────────────────────────────────────

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Constants ───────────────────────────────────────────

export const PLAN_DETAILS: Record<PlanType, { price: number; duration: number; vehicleLimit: number }> = {
  MONTHLY: { price: 299, duration: 1, vehicleLimit: 3 },
  QUARTERLY: { price: 499, duration: 3, vehicleLimit: 5 },
  SEMI_ANNUAL: { price: 699, duration: 6, vehicleLimit: 7 },
  YEARLY: { price: 999, duration: 12, vehicleLimit: 10 },
};

export const QR_SHORT_CODE_PREFIX = 'ST-';

// ─── Events (Redis pub/sub) ─────────────────────────────

export const EVENTS = {
  USER_CREATED: 'user.created',
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_CANCELED: 'subscription.canceled',
  SCAN_VERIFIED: 'scan.verified',
  COMPLAINT_CREATED: 'complaint.created',
  EMERGENCY_CREATED: 'emergency.created',
  VOIP_CALL_INITIATED: 'voip.call.initiated',
} as const;
