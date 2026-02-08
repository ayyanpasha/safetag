import { prisma } from '../lib/prisma.js';
import { nanoid } from 'nanoid';
import { NotFoundError, ValidationError, ForbiddenError } from '../middleware/error-handler.js';

const QR_SHORT_CODE_PREFIX = 'ST';
const QR_SHORT_CODE_LENGTH = 5;
const DEFAULT_VEHICLE_LIMIT = 1; // Free tier: 1 vehicle

export interface VehicleInfo {
  id: string;
  vehicleNumber: string;
  make: string | null;
  model: string | null;
  color: string | null;
  qrCode: string;
  qrShortCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleWithCheckIns extends VehicleInfo {
  recentCheckIns: Array<{
    id: string;
    location: unknown;
    scannedAt: Date;
  }>;
}

// Generate unique QR short code
async function generateQrShortCode(): Promise<string> {
  let shortCode: string;
  let exists = true;

  while (exists) {
    shortCode = `${QR_SHORT_CODE_PREFIX}-${nanoid(QR_SHORT_CODE_LENGTH)}`;
    const existing = await prisma.vehicle.findUnique({
      where: { qrShortCode: shortCode },
    });
    exists = !!existing;
  }

  return shortCode!;
}

// Get user's vehicle limit from subscription
// Each plan covers 1 vehicle, extra vehicles are purchased separately
async function getUserVehicleLimit(userId: string): Promise<number> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.status !== 'ACTIVE') {
    return DEFAULT_VEHICLE_LIMIT; // Free tier: 1 vehicle
  }

  // Base limit from plan (1) + any additional purchased vehicles
  return subscription.vehicleLimit + subscription.additionalVehicles;
}

// List user's vehicles
export async function listVehicles(userId: string): Promise<VehicleInfo[]> {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return vehicles.map((v) => ({
    id: v.id,
    vehicleNumber: v.vehicleNumber,
    make: v.make,
    model: v.model,
    color: v.color,
    qrCode: v.qrCode,
    qrShortCode: v.qrShortCode,
    isActive: v.isActive,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }));
}

// Create new vehicle
export async function createVehicle(
  userId: string,
  data: {
    vehicleNumber: string;
    make?: string;
    model?: string;
    color?: string;
  }
): Promise<VehicleInfo> {
  // Check vehicle limit
  const vehicleLimit = await getUserVehicleLimit(userId);
  const currentCount = await prisma.vehicle.count({
    where: { userId, isActive: true },
  });

  if (currentCount >= vehicleLimit) {
    throw new ForbiddenError(
      `Vehicle limit reached (${vehicleLimit}). Purchase additional vehicle slots at ₹99 each to add more vehicles.`
    );
  }

  // Check if vehicle number already exists
  const existing = await prisma.vehicle.findUnique({
    where: { vehicleNumber: data.vehicleNumber },
  });

  if (existing) {
    throw new ValidationError('Vehicle number already registered');
  }

  // Generate QR short code
  const qrShortCode = await generateQrShortCode();

  const vehicle = await prisma.vehicle.create({
    data: {
      userId,
      vehicleNumber: data.vehicleNumber,
      make: data.make,
      model: data.model,
      color: data.color,
      qrShortCode,
    },
  });

  return {
    id: vehicle.id,
    vehicleNumber: vehicle.vehicleNumber,
    make: vehicle.make,
    model: vehicle.model,
    color: vehicle.color,
    qrCode: vehicle.qrCode,
    qrShortCode: vehicle.qrShortCode,
    isActive: vehicle.isActive,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}

// Get vehicle by ID with recent check-ins
export async function getVehicleById(
  vehicleId: string,
  userId: string
): Promise<VehicleWithCheckIns> {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId,
      isActive: true,
    },
    include: {
      checkIns: {
        orderBy: { scannedAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  return {
    id: vehicle.id,
    vehicleNumber: vehicle.vehicleNumber,
    make: vehicle.make,
    model: vehicle.model,
    color: vehicle.color,
    qrCode: vehicle.qrCode,
    qrShortCode: vehicle.qrShortCode,
    isActive: vehicle.isActive,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
    recentCheckIns: vehicle.checkIns.map((c) => ({
      id: c.id,
      location: c.location,
      scannedAt: c.scannedAt,
    })),
  };
}

// Update vehicle
export async function updateVehicle(
  vehicleId: string,
  userId: string,
  data: {
    make?: string;
    model?: string;
    color?: string;
  }
): Promise<VehicleInfo> {
  // Check ownership
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId,
      isActive: true,
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const updated = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      make: data.make,
      model: data.model,
      color: data.color,
    },
  });

  return {
    id: updated.id,
    vehicleNumber: updated.vehicleNumber,
    make: updated.make,
    model: updated.model,
    color: updated.color,
    qrCode: updated.qrCode,
    qrShortCode: updated.qrShortCode,
    isActive: updated.isActive,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

// Soft delete vehicle
export async function deleteVehicle(
  vehicleId: string,
  userId: string
): Promise<void> {
  // Check ownership
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId,
      isActive: true,
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { isActive: false },
  });
}

// Get QR code data
export async function getVehicleQrCode(
  vehicleId: string,
  userId: string
): Promise<{
  qrCode: string;
  qrShortCode: string;
  scanUrl: string;
}> {
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId,
      isActive: true,
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const baseUrl = process.env.PUBLIC_URL || 'https://safetag.app';

  return {
    qrCode: vehicle.qrCode,
    qrShortCode: vehicle.qrShortCode,
    scanUrl: `${baseUrl}/scan/${vehicle.qrShortCode}`,
  };
}

// Record check-in
export async function recordCheckIn(
  vehicleId: string,
  location: { latitude: number; longitude: number }
): Promise<{ id: string; scannedAt: Date }> {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, isActive: true },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      vehicleId,
      location,
    },
  });

  return {
    id: checkIn.id,
    scannedAt: checkIn.scannedAt,
  };
}

// Find vehicle by short code (internal use)
export async function findVehicleByShortCode(shortCode: string): Promise<{
  id: string;
  vehicleNumber: string;
  userId: string;
  make: string | null;
  model: string | null;
  color: string | null;
  isActive: boolean;
} | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { qrShortCode: shortCode },
    select: {
      id: true,
      vehicleNumber: true,
      userId: true,
      make: true,
      model: true,
      color: true,
      isActive: true,
    },
  });

  return vehicle;
}

// Find vehicle by vehicle number (internal use)
export async function findVehicleByNumber(vehicleNumber: string): Promise<{
  id: string;
  vehicleNumber: string;
  userId: string;
  qrShortCode: string;
  isActive: boolean;
} | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { vehicleNumber },
    select: {
      id: true,
      vehicleNumber: true,
      userId: true,
      qrShortCode: true,
      isActive: true,
    },
  });

  return vehicle;
}

// Get vehicle owner ID
export async function getVehicleOwnerId(vehicleId: string): Promise<string | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { userId: true },
  });

  return vehicle?.userId || null;
}
