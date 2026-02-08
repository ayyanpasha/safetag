import { prisma } from '../lib/prisma.js';
import { publishEvent, EVENTS } from '../lib/redis.js';
import { validateSessionToken } from './scan.service.js';
import { getUserById } from './auth.service.js';
import { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError } from '../middleware/error-handler.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export type EmergencyType =
  | 'ACCIDENT'
  | 'CAR_CRASH'
  | 'THEFT'
  | 'VANDALISM'
  | 'FIRE'
  | 'OTHER';

export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface IncidentInfo {
  id: string;
  vehicleId: string;
  vehicleNumber?: string;
  emergencyType: string;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  status: string;
  scannerPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIncidentResult {
  id: string;
  status: string;
  message: string;
}

// Initialize S3 client (A10 SSRF - validate bucket/key)
function getS3Client(): S3Client {
  const region = process.env.S3_REGION || 'ap-south-1';

  return new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || '',
    },
    ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
  });
}

// Validate S3 key to prevent path traversal (A10 SSRF)
function sanitizeS3Key(key: string): string {
  // Remove any path traversal attempts
  return key.replace(/\.\./g, '').replace(/^\/+/, '');
}

// Upload photo to S3
async function uploadPhotoToS3(
  file: Buffer,
  mimeType: string
): Promise<string> {
  const bucket = process.env.S3_BUCKET;

  if (!bucket) {
    throw new Error('S3 bucket not configured');
  }

  const s3 = getS3Client();
  const extension = mimeType.split('/')[1] || 'jpg';
  const key = sanitizeS3Key(`incidents/${uuidv4()}.${extension}`);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
    })
  );

  // Return S3 URL or CDN URL
  const cdnDomain = process.env.CDN_DOMAIN;
  if (cdnDomain) {
    return `https://${cdnDomain}/${key}`;
  }

  return `https://${bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

// Send emergency WhatsApp notification
async function sendEmergencyNotification(
  ownerPhone: string,
  vehicleNumber: string,
  emergencyType: EmergencyType,
  latitude: number,
  longitude: number,
  photoUrl: string | null
): Promise<void> {
  const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const emergencyLabels: Record<EmergencyType, string> = {
    ACCIDENT: 'Accident',
    CAR_CRASH: 'Car Crash',
    THEFT: 'Theft',
    VANDALISM: 'Vandalism',
    FIRE: 'Fire',
    OTHER: 'Emergency',
  };

  const message = `
🚨 EMERGENCY ALERT 🚨

Vehicle: ${vehicleNumber}
Type: ${emergencyLabels[emergencyType]}
Location: ${mapLink}
${photoUrl ? `\nPhoto: ${photoUrl}` : ''}

Please respond immediately!
`.trim();

  // In production, send via WhatsApp API
  const whatsappUrl = process.env.WHATSAPP_API_URL_OWNER;
  const whatsappToken = process.env.WHATSAPP_TOKEN_OWNER;

  if (whatsappUrl && whatsappToken) {
    try {
      await fetch(whatsappUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${whatsappToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `91${ownerPhone}`,
          type: 'text',
          text: { body: message },
        }),
      });
    } catch (error) {
      console.error('Failed to send emergency WhatsApp:', error);
    }
  } else {
    console.log(`[MOCK] Emergency WhatsApp to ${ownerPhone}: ${message}`);
  }
}

// Report emergency incident
export async function reportEmergency(
  sessionToken: string,
  scannerPhone: string,
  otp: string,
  emergencyType: EmergencyType,
  latitude: number,
  longitude: number,
  photo?: { buffer: Buffer; mimeType: string }
): Promise<CreateIncidentResult> {
  // Validate session token
  const { valid, payload } = await validateSessionToken(sessionToken);

  if (!valid || !payload) {
    throw new UnauthorizedError('Invalid or expired session token');
  }

  // Verify OTP (simplified - in production, verify against auth service)
  // For emergency, we might want to relax OTP requirement
  if (!otp || otp.length !== 6) {
    throw new ValidationError('Valid OTP is required for emergency reports');
  }

  // Get owner info
  const owner = await getUserById(payload.ownerId);

  if (!owner) {
    throw new NotFoundError('Vehicle owner not found');
  }

  // Upload photo if provided
  let photoUrl: string | null = null;
  if (photo) {
    try {
      photoUrl = await uploadPhotoToS3(photo.buffer, photo.mimeType);
    } catch (error) {
      console.error('Photo upload failed:', error);
      // Continue without photo
    }
  }

  // Create incident record
  const incident = await prisma.incident.create({
    data: {
      vehicleId: payload.vehicleId,
      ownerId: payload.ownerId,
      scannerPhone,
      emergencyType,
      photoUrl,
      latitude,
      longitude,
      status: 'OPEN',
    },
  });

  // Send emergency notification (bypasses DND)
  await sendEmergencyNotification(
    owner.phone,
    payload.vehicleNumber,
    emergencyType,
    latitude,
    longitude,
    photoUrl
  );

  // Publish emergency event
  await publishEvent(EVENTS.EMERGENCY_CREATED, {
    incidentId: incident.id,
    vehicleId: payload.vehicleId,
    ownerId: payload.ownerId,
    emergencyType,
    latitude,
    longitude,
  });

  return {
    id: incident.id,
    status: 'OPEN',
    message: 'Emergency reported. Owner has been notified.',
  };
}

// Get user's incidents
export async function getUserIncidents(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ incidents: IncidentInfo[]; total: number }> {
  const [incidents, total] = await Promise.all([
    prisma.incident.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        vehicle: {
          select: { vehicleNumber: true },
        },
      },
    }),
    prisma.incident.count({
      where: { ownerId: userId },
    }),
  ]);

  return {
    incidents: incidents.map((i) => ({
      id: i.id,
      vehicleId: i.vehicleId,
      vehicleNumber: i.vehicle.vehicleNumber,
      emergencyType: i.emergencyType,
      photoUrl: i.photoUrl,
      latitude: i.latitude,
      longitude: i.longitude,
      status: i.status,
      scannerPhone: i.scannerPhone,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    })),
    total,
  };
}

// Get incident by ID
export async function getIncidentById(
  incidentId: string,
  userId: string
): Promise<IncidentInfo> {
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      ownerId: userId,
    },
    include: {
      vehicle: {
        select: { vehicleNumber: true },
      },
    },
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  return {
    id: incident.id,
    vehicleId: incident.vehicleId,
    vehicleNumber: incident.vehicle.vehicleNumber,
    emergencyType: incident.emergencyType,
    photoUrl: incident.photoUrl,
    latitude: incident.latitude,
    longitude: incident.longitude,
    status: incident.status,
    scannerPhone: incident.scannerPhone,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
  };
}

// Update incident status
export async function updateIncidentStatus(
  incidentId: string,
  userId: string,
  status: 'ACKNOWLEDGED' | 'RESOLVED'
): Promise<IncidentInfo> {
  const incident = await prisma.incident.findFirst({
    where: {
      id: incidentId,
      ownerId: userId,
    },
  });

  if (!incident) {
    throw new NotFoundError('Incident not found');
  }

  if (incident.status === 'RESOLVED') {
    throw new ForbiddenError('Cannot update a resolved incident');
  }

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: { status },
    include: {
      vehicle: {
        select: { vehicleNumber: true },
      },
    },
  });

  return {
    id: updated.id,
    vehicleId: updated.vehicleId,
    vehicleNumber: updated.vehicle.vehicleNumber,
    emergencyType: updated.emergencyType,
    photoUrl: updated.photoUrl,
    latitude: updated.latitude,
    longitude: updated.longitude,
    status: updated.status,
    scannerPhone: updated.scannerPhone,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

// Get vehicle incidents (for vehicle owner)
export async function getVehicleIncidents(
  vehicleId: string,
  userId: string,
  limit: number = 10
): Promise<IncidentInfo[]> {
  // Verify vehicle ownership
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId,
    },
  });

  if (!vehicle) {
    throw new NotFoundError('Vehicle not found');
  }

  const incidents = await prisma.incident.findMany({
    where: { vehicleId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return incidents.map((i) => ({
    id: i.id,
    vehicleId: i.vehicleId,
    emergencyType: i.emergencyType,
    photoUrl: i.photoUrl,
    latitude: i.latitude,
    longitude: i.longitude,
    status: i.status,
    scannerPhone: i.scannerPhone,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  }));
}

// Generate presigned URL for photo upload (alternative to direct upload)
export async function getPhotoUploadUrl(): Promise<{
  uploadUrl: string;
  photoUrl: string;
  expiresIn: number;
}> {
  const bucket = process.env.S3_BUCKET;

  if (!bucket) {
    throw new Error('S3 bucket not configured');
  }

  const s3 = getS3Client();
  const key = sanitizeS3Key(`incidents/${uuidv4()}.jpg`);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: 'image/jpeg',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uploadUrl = await getSignedUrl(s3 as any, command, { expiresIn: 300 });

  const cdnDomain = process.env.CDN_DOMAIN;
  const photoUrl = cdnDomain
    ? `https://${cdnDomain}/${key}`
    : `https://${bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    photoUrl,
    expiresIn: 300,
  };
}
