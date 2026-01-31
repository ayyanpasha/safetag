import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../generated/prisma/index.js';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  handleError,
  decryptSessionToken,
  publishEvent,
} from '@safetag/service-utils';
import type { ApiResponse } from '@safetag/shared-types';
import { uploadPhoto } from './services/s3.js';

const prisma = new PrismaClient();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const COMMUNICATION_SERVICE_URL = process.env.COMMUNICATION_SERVICE_URL || 'http://localhost:3004';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-secret';

// ─── Session token payload ──────────────────────────────

interface SessionPayload {
  vehicleId: string;
  ownerId: string;
  expiresAt: number;
}

// ─── Auth preHandler ────────────────────────────────────

interface AuthenticatedRequest {
  userId: string;
  userRole: string;
}

async function authPreHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.headers['x-user-id'] as string | undefined;
  const userRole = request.headers['x-user-role'] as string | undefined;

  if (!userId || !userRole) {
    const { statusCode, body } = handleError(new UnauthorizedError('Missing authentication headers'));
    return reply.code(statusCode).send(body);
  }

  (request as any).userId = userId;
  (request as any).userRole = userRole;
}

// ─── Route registration ─────────────────────────────────

export function registerRoutes(app: FastifyInstance) {
  // POST /api/incidents/emergency — multipart form: sessionToken, phone, otp, emergencyType, photo
  app.post('/api/incidents/emergency', async (request, reply) => {
    try {
      const parts = request.parts();

      let sessionToken = '';
      let phone = '';
      let otp = '';
      let emergencyType = '';
      let latitude = 0;
      let longitude = 0;
      let photoBuffer: Buffer | null = null;
      let photoFilename = 'photo.jpg';

      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.fieldname === 'photo') {
            photoBuffer = await part.toBuffer();
            photoFilename = part.filename || 'photo.jpg';
          }
        } else {
          // field
          const value = part.value as string;
          switch (part.fieldname) {
            case 'sessionToken':
              sessionToken = value;
              break;
            case 'phone':
              phone = value;
              break;
            case 'otp':
              otp = value;
              break;
            case 'emergencyType':
              emergencyType = value;
              break;
            case 'latitude':
              latitude = parseFloat(value);
              break;
            case 'longitude':
              longitude = parseFloat(value);
              break;
          }
        }
      }

      // Validate required fields
      if (!sessionToken || !phone || !otp || !emergencyType) {
        throw new ValidationError('Missing required fields: sessionToken, phone, otp, emergencyType');
      }

      // Decrypt and validate session token
      let session: SessionPayload;
      try {
        session = decryptSessionToken<SessionPayload>(sessionToken);
      } catch {
        throw new UnauthorizedError('Invalid session token');
      }

      if (Date.now() > session.expiresAt) {
        throw new UnauthorizedError('Session token has expired');
      }

      // Verify OTP via auth service
      const otpRes = await fetch(`${AUTH_SERVICE_URL}/internal/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': INTERNAL_API_KEY,
        },
        body: JSON.stringify({ phone, otp }),
      });

      if (!otpRes.ok) {
        const otpBody = await otpRes.json().catch(() => ({}));
        throw new UnauthorizedError((otpBody as any).message || 'OTP verification failed');
      }

      // Upload photo to S3/R2 if provided
      let photoUrl: string | null = null;
      if (photoBuffer) {
        photoUrl = await uploadPhoto(photoBuffer, photoFilename);
      }

      // Create incident record
      const incident = await prisma.incident.create({
        data: {
          vehicleId: session.vehicleId,
          ownerId: session.ownerId,
          scannerPhone: phone,
          emergencyType: emergencyType as any,
          photoUrl,
          latitude,
          longitude,
        },
      });

      // Send WhatsApp to owner's emergency contact via communication service (bypasses DND)
      try {
        await fetch(`${COMMUNICATION_SERVICE_URL}/internal/comms/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': INTERNAL_API_KEY,
          },
          body: JSON.stringify({
            ownerId: session.ownerId,
            vehicleId: session.vehicleId,
            incidentId: incident.id,
            emergencyType,
            latitude,
            longitude,
            photoUrl,
            bypassDnd: true,
          }),
        });
      } catch (err) {
        // Log but do not fail the request if comms service is unreachable
        request.log.error(err, 'Failed to send WhatsApp notification');
      }

      // Publish event
      await publishEvent('EMERGENCY_CREATED', {
        incidentId: incident.id,
        vehicleId: session.vehicleId,
        ownerId: session.ownerId,
        emergencyType,
        latitude,
        longitude,
      });

      const response: ApiResponse = {
        success: true,
        data: { incidentId: incident.id },
        message: 'Emergency incident created',
      };
      return reply.code(201).send(response);
    } catch (err) {
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // GET /api/incidents — list incidents for owner
  app.get('/api/incidents', { preHandler: authPreHandler }, async (request, reply) => {
    try {
      const { userId } = request as any as AuthenticatedRequest;

      const incidents = await prisma.incident.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
      });

      const response: ApiResponse = { success: true, data: incidents };
      return reply.send(response);
    } catch (err) {
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // GET /api/incidents/:id — get incident details (must be owner)
  app.get<{ Params: { id: string } }>(
    '/api/incidents/:id',
    { preHandler: authPreHandler },
    async (request, reply) => {
      try {
        const { userId } = request as any as AuthenticatedRequest;
        const { id } = request.params;

        const incident = await prisma.incident.findUnique({ where: { id } });

        if (!incident || incident.ownerId !== userId) {
          throw new NotFoundError('Incident');
        }

        const response: ApiResponse = { success: true, data: incident };
        return reply.send(response);
      } catch (err) {
        const { statusCode, body } = handleError(err);
        return reply.code(statusCode).send(body);
      }
    },
  );

  // PATCH /api/incidents/:id/status — update status (ACKNOWLEDGED, RESOLVED)
  app.patch<{ Params: { id: string } }>(
    '/api/incidents/:id/status',
    { preHandler: authPreHandler },
    async (request, reply) => {
      try {
        const { userId } = request as any as AuthenticatedRequest;
        const { id } = request.params;

        const body = request.body as Record<string, unknown>;
        const newStatus = body.status as string;

        if (!newStatus || !['ACKNOWLEDGED', 'RESOLVED'].includes(newStatus)) {
          throw new ValidationError('status must be ACKNOWLEDGED or RESOLVED');
        }

        const incident = await prisma.incident.findUnique({ where: { id } });

        if (!incident || incident.ownerId !== userId) {
          throw new NotFoundError('Incident');
        }

        const updated = await prisma.incident.update({
          where: { id },
          data: { status: newStatus as any },
        });

        const response: ApiResponse = { success: true, data: updated };
        return reply.send(response);
      } catch (err) {
        const { statusCode, body } = handleError(err);
        return reply.code(statusCode).send(body);
      }
    },
  );
}
