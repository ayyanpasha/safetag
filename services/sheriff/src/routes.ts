import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../generated/prisma/index.js';
import { z } from 'zod';
import {
  encryptSessionToken,
  decryptSessionToken,
  redis,
  publishEvent,
  handleError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  logger,
} from '@safetag/service-utils';
import { EVENTS, type SessionTokenPayload, type ApiResponse } from '@safetag/shared-types';

const prisma = new PrismaClient();

const VEHICLE_SERVICE_URL = process.env.VEHICLE_SERVICE_URL || 'http://localhost:3002';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

if (process.env.NODE_ENV === 'production' && !process.env.INTERNAL_API_KEY) {
  throw new Error('INTERNAL_API_KEY must be set in production');
}

async function internalAuthPreHandler(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-internal-api-key'] as string | undefined;
  if (!apiKey || apiKey !== INTERNAL_API_KEY) {
    const { statusCode, body } = handleError(new ForbiddenError('Invalid internal API key'));
    return reply.status(statusCode).send(body);
  }
}

// ─── Schemas ────────────────────────────────────────────

const ScanInitiateSchema = z.object({
  shortCode: z.string().min(1),
  vehicleNumber: z.string().min(1),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  fingerprint: z.string().min(1),
});

const ValidateTokenSchema = z.object({
  sessionToken: z.string().min(1),
});

const BlocklistSchema = z.object({
  fingerprint: z.string().min(1),
  reason: z.string().min(1),
});

// ─── Helpers ────────────────────────────────────────────

async function fetchVehicleByShortCode(shortCode: string) {
  const url = `${VEHICLE_SERVICE_URL}/internal/vehicles/by-shortcode/${encodeURIComponent(shortCode)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': INTERNAL_API_KEY,
    },
  });

  if (!res.ok) {
    if (res.status === 404) throw new NotFoundError('Vehicle');
    throw new Error(`Vehicle service returned ${res.status}`);
  }

  const body = (await res.json()) as ApiResponse<{
    vehicle: {
      id: string;
      userId: string;
      vehicleNumber: string;
      ownerName?: string;
    };
    userId: string;
  }>;

  if (!body.success || !body.data?.vehicle) {
    throw new NotFoundError('Vehicle');
  }

  return body.data.vehicle;
}

function sanitizeFingerprint(fp: string): string {
  return fp.replace(/[:\*\?\[\]\s]/g, '').slice(0, 100);
}

async function checkRateLimit(fingerprint: string): Promise<void> {
  const key = `sheriff:rate:${sanitizeFingerprint(fingerprint)}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 600); // 10 minutes TTL
  }
  if (count > 5) {
    throw new ForbiddenError('Rate limit exceeded. Try again later.');
  }
}

async function checkBlocklist(fingerprint: string): Promise<void> {
  const blocked = await prisma.blocklist.findUnique({ where: { fingerprint } });
  if (blocked) {
    throw new ForbiddenError('This device has been blocked.');
  }
}

// ─── Routes ─────────────────────────────────────────────

export function registerRoutes(app: FastifyInstance) {
  // POST /api/scan/initiate
  app.post('/api/scan/initiate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = ScanInitiateSchema.parse(request.body);

      // Fetch vehicle from vehicle service
      const vehicle = await fetchVehicleByShortCode(body.shortCode);

      // Validate vehicle number matches (case insensitive)
      if (vehicle.vehicleNumber.toUpperCase() !== body.vehicleNumber.toUpperCase()) {
        throw new ValidationError('Vehicle number does not match.');
      }

      // Check blocklist
      await checkBlocklist(body.fingerprint);

      // Check rate limit
      await checkRateLimit(body.fingerprint);

      // Generate session token
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      const tokenPayload: SessionTokenPayload = {
        vehicleNumber: vehicle.vehicleNumber,
        lat: body.location.latitude,
        lng: body.location.longitude,
        ownerId: vehicle.userId,
        vehicleId: vehicle.id,
        exp: expiresAt.getTime(),
      };

      const sessionToken = encryptSessionToken(tokenPayload);

      // Store scan session
      await prisma.scanSession.create({
        data: {
          vehicleId: vehicle.id,
          vehicleNumber: vehicle.vehicleNumber,
          scannerFingerprint: body.fingerprint,
          scannerIp: request.ip,
          latitude: body.location.latitude,
          longitude: body.location.longitude,
          sessionToken,
          expiresAt,
        },
      });

      // Publish event
      await publishEvent(EVENTS.SCAN_VERIFIED, {
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        ownerId: vehicle.userId,
        latitude: body.location.latitude,
        longitude: body.location.longitude,
        timestamp: new Date().toISOString(),
      });

      return reply.send({
        success: true,
        data: {
          sessionToken,
          expiresAt: expiresAt.toISOString(),
          ownerName: vehicle.ownerName || 'Vehicle Owner',
        },
      });
    } catch (err) {
      const { statusCode, body } = handleError(err);
      return reply.status(statusCode).send(body);
    }
  });

  // POST /api/scan/validate-token
  app.post('/api/scan/validate-token', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionToken } = ValidateTokenSchema.parse(request.body);

      const payload = decryptSessionToken<SessionTokenPayload>(sessionToken);

      if (payload.exp < Date.now()) {
        throw new ForbiddenError('Session token has expired.');
      }

      return reply.send({ success: true, data: payload });
    } catch (err) {
      const { statusCode, body } = handleError(err);
      return reply.status(statusCode).send(body);
    }
  });

  // GET /api/scan/session/:token
  app.get('/api/scan/session/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token } = request.params as { token: string };

      const session = await prisma.scanSession.findUnique({
        where: { sessionToken: token },
      });

      if (!session) {
        throw new NotFoundError('Scan session');
      }

      return reply.send({ success: true, data: session });
    } catch (err) {
      const { statusCode, body } = handleError(err);
      return reply.status(statusCode).send(body);
    }
  });

  // POST /internal/scan/blocklist
  app.post('/internal/scan/blocklist', { preHandler: internalAuthPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = BlocklistSchema.parse(request.body);

      const entry = await prisma.blocklist.upsert({
        where: { fingerprint: body.fingerprint },
        update: { reason: body.reason },
        create: {
          fingerprint: body.fingerprint,
          reason: body.reason,
        },
      });

      return reply.send({ success: true, data: entry });
    } catch (err) {
      const { statusCode, body } = handleError(err);
      return reply.status(statusCode).send(body);
    }
  });
}
