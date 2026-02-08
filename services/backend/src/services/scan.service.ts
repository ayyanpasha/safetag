import { prisma } from '../lib/prisma.js';
import { redis, publishEvent, EVENTS } from '../lib/redis.js';
import { encryptSessionToken, decryptSessionToken } from '../lib/crypto.js';
import { findVehicleByShortCode } from './vehicle.service.js';
import { getUserById } from './auth.service.js';
import { NotFoundError, ForbiddenError } from '../middleware/error-handler.js';

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export interface SessionTokenPayload {
  vehicleId: string;
  ownerId: string;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
  exp: number;
}

export interface ScanValidateResult {
  valid: boolean;
  maskedNumber: string | null;
  vehicleId: string | null;
}

export interface ScanInitiateResult {
  sessionToken: string;
  vehicleNumber: string;
  ownerName: string | null;
  expiresIn: number;
}

export interface ScanConnectResult {
  ownerPhone: string;
  vehicleNumber: string;
  maskedNumber: string;
}

// Sanitize fingerprint to prevent injection
function sanitizeFingerprint(fingerprint: string): string {
  return fingerprint.slice(0, 500).replace(/[<>"'&]/g, '');
}

// Mask vehicle number (show first 4 and last 2 chars)
function maskVehicleNumber(vehicleNumber: string): string {
  if (vehicleNumber.length <= 6) {
    return vehicleNumber;
  }
  const visible = vehicleNumber.slice(0, 4) + '****' + vehicleNumber.slice(-2);
  return visible;
}

// Check if fingerprint is blocklisted
async function isBlocklisted(fingerprint: string): Promise<boolean> {
  const sanitized = sanitizeFingerprint(fingerprint);
  const blocklist = await prisma.blocklist.findUnique({
    where: { fingerprint: sanitized },
  });
  return !!blocklist;
}

// Validate QR code
export async function validateQrCode(shortCode: string): Promise<ScanValidateResult> {
  const vehicle = await findVehicleByShortCode(shortCode);

  if (!vehicle || !vehicle.isActive) {
    return {
      valid: false,
      maskedNumber: null,
      vehicleId: null,
    };
  }

  return {
    valid: true,
    maskedNumber: maskVehicleNumber(vehicle.vehicleNumber),
    vehicleId: vehicle.id,
  };
}

// Initiate scan and generate session token
export async function initiateScan(
  shortCode: string,
  fingerprint: string,
  latitude: number,
  longitude: number,
  scannerIp: string
): Promise<ScanInitiateResult> {
  const sanitizedFingerprint = sanitizeFingerprint(fingerprint);

  // Check blocklist
  if (await isBlocklisted(sanitizedFingerprint)) {
    throw new ForbiddenError('This device has been blocked');
  }

  // Find vehicle
  const vehicle = await findVehicleByShortCode(shortCode);

  if (!vehicle || !vehicle.isActive) {
    throw new NotFoundError('Vehicle not found');
  }

  // Get owner info
  const owner = await getUserById(vehicle.userId);

  if (!owner) {
    throw new NotFoundError('Vehicle owner not found');
  }

  // Create session token payload
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload: SessionTokenPayload = {
    vehicleId: vehicle.id,
    ownerId: owner.id,
    vehicleNumber: vehicle.vehicleNumber,
    latitude,
    longitude,
    exp: expiresAt,
  };

  // Encrypt session token
  const sessionToken = encryptSessionToken(payload);

  // Store scan session in database
  await prisma.scanSession.create({
    data: {
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      scannerFingerprint: sanitizedFingerprint,
      scannerIp,
      latitude,
      longitude,
      sessionToken,
      expiresAt: new Date(expiresAt),
    },
  });

  // Publish scan event
  await publishEvent(EVENTS.SCAN_VERIFIED, {
    vehicleId: vehicle.id,
    ownerId: owner.id,
    scannerFingerprint: sanitizedFingerprint,
    latitude,
    longitude,
  });

  return {
    sessionToken,
    vehicleNumber: maskVehicleNumber(vehicle.vehicleNumber),
    ownerName: owner.name,
    expiresIn: SESSION_DURATION_MS / 1000,
  };
}

// Validate session token
export async function validateSessionToken(sessionToken: string): Promise<{
  valid: boolean;
  payload: SessionTokenPayload | null;
}> {
  try {
    const payload = decryptSessionToken<SessionTokenPayload>(sessionToken);

    // Check expiration
    if (Date.now() > payload.exp) {
      return { valid: false, payload: null };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, payload: null };
  }
}

// Get session details by token
export async function getSessionByToken(sessionToken: string): Promise<{
  vehicleId: string;
  vehicleNumber: string;
  maskedNumber: string;
  latitude: number;
  longitude: number;
  expiresAt: Date;
} | null> {
  const session = await prisma.scanSession.findUnique({
    where: { sessionToken },
  });

  if (!session) {
    return null;
  }

  return {
    vehicleId: session.vehicleId,
    vehicleNumber: session.vehicleNumber,
    maskedNumber: maskVehicleNumber(session.vehicleNumber),
    latitude: session.latitude,
    longitude: session.longitude,
    expiresAt: session.expiresAt,
  };
}

// Get owner phone for connect (simplified flow)
export async function getConnectInfo(shortCode: string): Promise<ScanConnectResult> {
  const vehicle = await findVehicleByShortCode(shortCode);

  if (!vehicle || !vehicle.isActive) {
    throw new NotFoundError('Vehicle not found');
  }

  const owner = await getUserById(vehicle.userId);

  if (!owner) {
    throw new NotFoundError('Vehicle owner not found');
  }

  return {
    ownerPhone: owner.phone,
    vehicleNumber: vehicle.vehicleNumber,
    maskedNumber: maskVehicleNumber(vehicle.vehicleNumber),
  };
}

// Add device to blocklist
export async function addToBlocklist(
  fingerprint: string,
  reason: string
): Promise<void> {
  const sanitized = sanitizeFingerprint(fingerprint);

  await prisma.blocklist.upsert({
    where: { fingerprint: sanitized },
    create: {
      fingerprint: sanitized,
      reason,
    },
    update: {
      reason,
    },
  });
}

// Remove device from blocklist
export async function removeFromBlocklist(fingerprint: string): Promise<void> {
  const sanitized = sanitizeFingerprint(fingerprint);

  await prisma.blocklist.deleteMany({
    where: { fingerprint: sanitized },
  });
}

// Get scan history for vehicle
export async function getVehicleScanHistory(
  vehicleId: string,
  limit: number = 20
): Promise<Array<{
  id: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
}>> {
  const sessions = await prisma.scanSession.findMany({
    where: { vehicleId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      latitude: true,
      longitude: true,
      createdAt: true,
    },
  });

  return sessions;
}

// Cache session token in Redis for faster validation
export async function cacheSessionToken(
  sessionToken: string,
  payload: SessionTokenPayload
): Promise<void> {
  const key = `session:${sessionToken.slice(-32)}`;
  const ttl = Math.floor((payload.exp - Date.now()) / 1000);

  if (ttl > 0) {
    await redis.setex(key, ttl, JSON.stringify(payload));
  }
}

// Get cached session token
export async function getCachedSession(
  sessionToken: string
): Promise<SessionTokenPayload | null> {
  const key = `session:${sessionToken.slice(-32)}`;
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached) as SessionTokenPayload;
  }

  return null;
}
