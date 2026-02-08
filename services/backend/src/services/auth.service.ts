import { prisma } from '../lib/prisma.js';
import { redis, publishEvent, EVENTS } from '../lib/redis.js';
import { generateTokenPair, verifyRefreshToken, TokenPayload } from '../lib/jwt.js';
import { generateOtp } from '../lib/crypto.js';
import { NotFoundError, ValidationError, UnauthorizedError } from '../middleware/error-handler.js';

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCKOUT_MINUTES = 15;

export interface OtpSendResult {
  success: boolean;
  message: string;
  expiresIn: number;
}

export interface OtpVerifyResult {
  success: boolean;
  isNewUser: boolean;
  user: {
    id: string;
    phone: string;
    name: string | null;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: string;
  emergencyContact: string | null;
  dndEnabled: boolean;
  dndStart: string | null;
  dndEnd: string | null;
  createdAt: Date;
}

// Check if phone is rate limited for OTP attempts
async function isOtpRateLimited(phone: string): Promise<boolean> {
  const key = `otp:attempts:${phone}`;
  const attempts = await redis.get(key);
  return attempts !== null && parseInt(attempts, 10) >= OTP_MAX_ATTEMPTS;
}

// Increment OTP attempts
async function incrementOtpAttempts(phone: string): Promise<void> {
  const key = `otp:attempts:${phone}`;
  await redis.incr(key);
  await redis.expire(key, OTP_LOCKOUT_MINUTES * 60);
}

// Clear OTP attempts on successful verification
async function clearOtpAttempts(phone: string): Promise<void> {
  const key = `otp:attempts:${phone}`;
  await redis.del(key);
}

// Send OTP to phone number
export async function sendOtp(phone: string): Promise<OtpSendResult> {
  // Check rate limiting
  if (await isOtpRateLimited(phone)) {
    throw new ValidationError(
      `Too many OTP requests. Please try again after ${OTP_LOCKOUT_MINUTES} minutes.`
    );
  }

  // Invalidate any existing OTPs
  await prisma.otpCode.updateMany({
    where: { phone, used: false },
    data: { used: true },
  });

  // Generate new OTP
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: {
      phone,
      code,
      expiresAt,
    },
  });

  // In production, send OTP via SMS service
  // For now, log it (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${phone}: ${code}`);
  }

  // TODO: Integrate SMS service (MSG91, Twilio, etc.)
  // await smsService.send(phone, `Your SafeTag OTP is: ${code}`);

  return {
    success: true,
    message: 'OTP sent successfully',
    expiresIn: OTP_EXPIRY_MINUTES * 60,
  };
}

// Verify OTP and authenticate user
export async function verifyOtp(
  phone: string,
  code: string
): Promise<OtpVerifyResult> {
  // Find valid OTP
  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    await incrementOtpAttempts(phone);
    throw new UnauthorizedError('Invalid or expired OTP');
  }

  // Mark OTP as used
  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  // Clear rate limit attempts
  await clearOtpAttempts(phone);

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { phone },
  });

  const isNewUser = !user;

  if (!user) {
    user = await prisma.user.create({
      data: { phone },
    });

    // Publish user created event
    await publishEvent(EVENTS.USER_CREATED, {
      userId: user.id,
      phone: user.phone,
    });
  }

  // Generate tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
  };

  const tokens = generateTokenPair(tokenPayload);

  // Store refresh token hash in Redis for invalidation
  const refreshTokenKey = `refresh:${user.id}`;
  await redis.setex(refreshTokenKey, 7 * 24 * 60 * 60, tokens.refreshToken.slice(-32));

  return {
    success: true,
    isNewUser,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Check if refresh token is still valid in Redis
  const refreshTokenKey = `refresh:${payload.userId}`;
  const storedTokenSuffix = await redis.get(refreshTokenKey);

  if (!storedTokenSuffix || storedTokenSuffix !== refreshToken.slice(-32)) {
    throw new UnauthorizedError('Refresh token has been revoked');
  }

  // Get current user data
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Generate new token pair
  const tokenPayload: TokenPayload = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
  };

  const tokens = generateTokenPair(tokenPayload);

  // Update stored refresh token
  await redis.setex(refreshTokenKey, 7 * 24 * 60 * 60, tokens.refreshToken.slice(-32));

  return tokens;
}

// Get user profile
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    role: user.role,
    emergencyContact: user.emergencyContact,
    dndEnabled: user.dndEnabled,
    dndStart: user.dndStart,
    dndEnd: user.dndEnd,
    createdAt: user.createdAt,
  };
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    email?: string;
    emergencyContact?: string;
    dndEnabled?: boolean;
    dndStart?: string;
    dndEnd?: string;
  }
): Promise<UserProfile> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      email: data.email,
      emergencyContact: data.emergencyContact,
      dndEnabled: data.dndEnabled,
      dndStart: data.dndStart,
      dndEnd: data.dndEnd,
    },
  });

  // Update DND config if DND settings changed
  if (data.dndEnabled !== undefined || data.dndStart || data.dndEnd) {
    await prisma.dndConfig.upsert({
      where: { userId },
      create: {
        userId,
        enabled: data.dndEnabled ?? false,
        startTime: data.dndStart ?? '22:00',
        endTime: data.dndEnd ?? '07:00',
      },
      update: {
        enabled: data.dndEnabled,
        startTime: data.dndStart,
        endTime: data.dndEnd,
      },
    });
  }

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    role: user.role,
    emergencyContact: user.emergencyContact,
    dndEnabled: user.dndEnabled,
    dndStart: user.dndStart,
    dndEnd: user.dndEnd,
    createdAt: user.createdAt,
  };
}

// Get user by ID (internal)
export async function getUserById(userId: string): Promise<{
  id: string;
  phone: string;
  name: string | null;
  role: string;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      name: true,
      role: true,
    },
  });

  return user;
}

// Logout - invalidate refresh token
export async function logout(userId: string): Promise<void> {
  const refreshTokenKey = `refresh:${userId}`;
  await redis.del(refreshTokenKey);
}
