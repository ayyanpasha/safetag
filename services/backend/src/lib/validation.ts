import { z } from 'zod';

// HTML sanitization for XSS prevention (A03 Injection mitigation)
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Sanitize object values recursively
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeHtml(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>
      );
    }
  }
  return sanitized;
}

// Phone validation (Indian format)
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid phone number (must be 10 digits starting with 6-9)');

// OTP validation
export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, 'OTP must be 6 digits');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Vehicle number validation
export const vehicleNumberSchema = z
  .string()
  .min(4, 'Vehicle number too short')
  .max(15, 'Vehicle number too long')
  .transform((val) => val.toUpperCase().replace(/\s/g, ''));

// Location validation
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Auth schemas
export const otpSendSchema = z.object({
  phone: phoneSchema,
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: otpSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  emergencyContact: phoneSchema.optional(),
  dndEnabled: z.boolean().optional(),
  dndStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dndEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// Vehicle schemas
export const createVehicleSchema = z.object({
  vehicleNumber: vehicleNumberSchema,
  make: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  color: z.string().max(30).optional(),
});

export const updateVehicleSchema = z.object({
  make: z.string().max(50).optional(),
  model: z.string().max(50).optional(),
  color: z.string().max(30).optional(),
});

export const checkInSchema = z.object({
  location: locationSchema,
});

// Scan schemas
export const initiatecanSchema = z.object({
  shortCode: z.string().min(1),
  fingerprint: z.string().min(1).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const validateTokenSchema = z.object({
  sessionToken: z.string().min(1),
});

// Contact schemas
export const whatsappComplaintSchema = z.object({
  sessionToken: z.string().min(1),
  problemType: z.enum([
    'WRONG_PARKING',
    'GETTING_TOWED',
    'LIGHTS_ON',
    'BLOCKING_DRIVEWAY',
    'ALARM_GOING_OFF',
    'DOOR_OPEN',
    'OTHER',
  ]),
  message: z.string().max(500).optional(),
});

export const voipOtpSchema = z.object({
  sessionToken: z.string().min(1),
  phone: phoneSchema,
});

export const voipInitiateSchema = z.object({
  sessionToken: z.string().min(1),
  phone: phoneSchema,
  otp: otpSchema,
});

// Payment schemas
export const subscribeSchema = z.object({
  plan: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'YEARLY']),
});

// Affiliate schemas
export const registerDealerSchema = z.object({
  businessName: z.string().min(1).max(200),
});

export const applyReferralSchema = z.object({
  code: z.string().min(1),
});

export const payoutRequestSchema = z.object({
  amount: z.number().int().positive(),
});

// Incident schemas
export const emergencyReportSchema = z.object({
  sessionToken: z.string().min(1),
  phone: phoneSchema,
  otp: otpSchema,
  emergencyType: z.enum([
    'ACCIDENT',
    'CAR_CRASH',
    'THEFT',
    'VANDALISM',
    'FIRE',
    'OTHER',
  ]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updateIncidentStatusSchema = z.object({
  status: z.enum(['ACKNOWLEDGED', 'RESOLVED']),
});

// Type exports
export type OtpSendInput = z.infer<typeof otpSendSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type InitiateScanInput = z.infer<typeof initiatecanSchema>;
export type WhatsAppComplaintInput = z.infer<typeof whatsappComplaintSchema>;
export type VoipOtpInput = z.infer<typeof voipOtpSchema>;
export type VoipInitiateInput = z.infer<typeof voipInitiateSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type RegisterDealerInput = z.infer<typeof registerDealerSchema>;
export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;
export type EmergencyReportInput = z.infer<typeof emergencyReportSchema>;
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>;
