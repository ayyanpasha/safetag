import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../generated/prisma/index.js';
import { customAlphabet } from 'nanoid';
import {
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  handleError,
} from '@safetag/service-utils';
import {
  CreateVehicleSchema,
  LocationSchema,
  QR_SHORT_CODE_PREFIX,
} from '@safetag/shared-types';
import type { ApiResponse } from '@safetag/shared-types';

const prisma = new PrismaClient();
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 5);

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-secret';

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

// ─── Internal auth preHandler ───────────────────────────

async function internalAuthPreHandler(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-internal-api-key'] as string | undefined;
  if (!apiKey || apiKey !== INTERNAL_API_KEY) {
    const { statusCode, body } = handleError(new ForbiddenError('Invalid internal API key'));
    return reply.code(statusCode).send(body);
  }
}

// ─── Helper: generate unique short code ─────────────────

async function generateUniqueShortCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = `${QR_SHORT_CODE_PREFIX}${nanoid()}`;
    const existing = await prisma.vehicle.findUnique({ where: { qrShortCode: code } });
    if (!existing) return code;
  }
  throw new Error('Failed to generate unique short code after 10 attempts');
}

// ─── Route registration ─────────────────────────────────

export function registerRoutes(app: FastifyInstance) {
  // GET /api/vehicles — list user's vehicles
  app.get('/api/vehicles', { preHandler: authPreHandler }, async (request, reply) => {
    try {
      const { userId } = request as any as AuthenticatedRequest;

      const vehicles = await prisma.vehicle.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      const response: ApiResponse = { success: true, data: vehicles };
      return reply.send(response);
    } catch (err) {
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // POST /api/vehicles — create a new vehicle
  app.post('/api/vehicles', { preHandler: authPreHandler }, async (request, reply) => {
    try {
      const { userId } = request as any as AuthenticatedRequest;

      const parsed = CreateVehicleSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
      }

      const { vehicleNumber, make, model, color } = parsed.data;

      // Check if vehicle number already exists
      const existingVehicle = await prisma.vehicle.findUnique({ where: { vehicleNumber } });
      if (existingVehicle) {
        throw new ValidationError('Vehicle number already registered');
      }

      // Check vehicle count limit (default limit 3 for free tier)
      const vehicleCount = await prisma.vehicle.count({
        where: { userId, isActive: true },
      });

      const VEHICLE_LIMIT = Number(process.env.DEFAULT_VEHICLE_LIMIT) || 3;
      if (vehicleCount >= VEHICLE_LIMIT) {
        throw new ValidationError(
          `Vehicle limit reached (${VEHICLE_LIMIT}). Upgrade your subscription to add more vehicles.`,
        );
      }

      const qrShortCode = await generateUniqueShortCode();

      const vehicle = await prisma.vehicle.create({
        data: {
          userId,
          vehicleNumber,
          make: make ?? null,
          model: model ?? null,
          color: color ?? null,
          qrShortCode,
        },
      });

      const response: ApiResponse = { success: true, data: vehicle, message: 'Vehicle created successfully' };
      return reply.code(201).send(response);
    } catch (err) {
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // GET /api/vehicles/:id — get vehicle detail with recent check-ins
  app.get<{ Params: { id: string } }>(
    '/api/vehicles/:id',
    { preHandler: authPreHandler },
    async (request, reply) => {
      try {
        const { userId } = request as any as AuthenticatedRequest;
        const { id } = request.params;

        const vehicle = await prisma.vehicle.findUnique({
          where: { id },
          include: {
            checkIns: {
              orderBy: { scannedAt: 'desc' },
              take: 20,
            },
          },
        });

        if (!vehicle || vehicle.userId !== userId) {
          throw new NotFoundError('Vehicle');
        }

        const response: ApiResponse = { success: true, data: vehicle };
        return reply.send(response);
      } catch (err) {
        const { statusCode, body } = handleError(err);
        return reply.code(statusCode).send(body);
      }
    },
  );

  // PATCH /api/vehicles/:id — update vehicle details
  app.patch<{ Params: { id: string } }>(
    '/api/vehicles/:id',
    { preHandler: authPreHandler },
    async (request, reply) => {
      try {
        const { userId } = request as any as AuthenticatedRequest;
        const { id } = request.params;

        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle || vehicle.userId !== userId) {
          throw new NotFoundError('Vehicle');
        }

        const body = request.body as Record<string, unknown>;
        const allowedFields = ['make', 'model', 'color', 'isActive'];
        const updateData: Record<string, unknown> = {};

        for (const field of allowedFields) {
          if (body[field] !== undefined) {
            updateData[field] = body[field];
          }
        }

        if (Object.keys(updateData).length === 0) {
          throw new ValidationError('No valid fields to update');
        }

        const updated = await prisma.vehicle.update({
          where: { id },
          data: updateData,
        });

        const response: ApiResponse = { success: true, data: updated };
        return reply.send(response);
      } catch (err) {
        const { statusCode, body } = handleError(err);
        return reply.code(statusCode).send(body);
      }
    },
  );

  // DELETE /api/vehicles/:id — soft delete (set isActive false)
  app.delete<{ Params: { id: string } }>(
    '/api/vehicles/:id',
    { preHandler: authPreHandler },
    async (request, reply) => {
      try {
        const { userId } = request as any as AuthenticatedRequest;
        const { id } = request.params;

        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle || vehicle.userId !== userId) {
          throw new NotFoundError('Vehicle');
        }

        await prisma.vehicle.update({
          where: { id },
          data: { isActive: false },
        });

        const response: ApiResponse = { success: true, message: 'Vehicle deactivated' };
        return reply.send(response);
      } catch (err) {
        const { statusCode, body } = handleError(err);
        return reply.code(statusCode).send(body);
      }
    },
  );

  // GET /api/vehicles/:id/qr — return QR code data
  app.get<{ Params: { id: string } }>(
    '/api/vehicles/:id/qr',
    { preHandler: authPreHandler },
    async (request, reply) => {
      try {
        const { userId } = request as any as AuthenticatedRequest;
        const { id } = request.params;

        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle || vehicle.userId !== userId) {
          throw new NotFoundError('Vehicle');
        }

        const qrUrl = `https://safetag.in/s/${vehicle.qrShortCode}`;

        const response: ApiResponse = {
          success: true,
          data: {
            vehicleId: vehicle.id,
            vehicleNumber: vehicle.vehicleNumber,
            qrCode: vehicle.qrCode,
            qrShortCode: vehicle.qrShortCode,
            qrUrl,
          },
        };
        return reply.send(response);
      } catch (err) {
        const { statusCode, body } = handleError(err);
        return reply.code(statusCode).send(body);
      }
    },
  );

  // POST /api/vehicles/:id/checkin — log a check-in with GPS location
  app.post<{ Params: { id: string } }>(
    '/api/vehicles/:id/checkin',
    async (request, reply) => {
      try {
        const { id } = request.params;

        const parsed = LocationSchema.safeParse(request.body);
        if (!parsed.success) {
          throw new ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        }

        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle || !vehicle.isActive) {
          throw new NotFoundError('Vehicle');
        }

        const checkIn = await prisma.checkIn.create({
          data: {
            vehicleId: id,
            location: parsed.data as any,
          },
        });

        const response: ApiResponse = { success: true, data: checkIn };
        return reply.code(201).send(response);
      } catch (err) {
        const { statusCode, body } = handleError(err);
        return reply.code(statusCode).send(body);
      }
    },
  );

  // ─── Internal routes ────────────────────────────────────

  // GET /internal/vehicles/by-number/:vehicleNumber
  app.get<{ Params: { vehicleNumber: string } }>(
    '/internal/vehicles/by-number/:vehicleNumber',
    { preHandler: internalAuthPreHandler },
    async (request, reply) => {
      try {
        const { vehicleNumber } = request.params;

        const vehicle = await prisma.vehicle.findUnique({
          where: { vehicleNumber },
        });

        if (!vehicle) {
          throw new NotFoundError('Vehicle');
        }

        const response: ApiResponse = {
          success: true,
          data: { vehicle, userId: vehicle.userId },
        };
        return reply.send(response);
      } catch (err) {
        const { statusCode, body } = handleError(err);
        return reply.code(statusCode).send(body);
      }
    },
  );

  // GET /internal/vehicles/by-shortcode/:shortCode
  app.get<{ Params: { shortCode: string } }>(
    '/internal/vehicles/by-shortcode/:shortCode',
    { preHandler: internalAuthPreHandler },
    async (request, reply) => {
      try {
        const { shortCode } = request.params;

        const vehicle = await prisma.vehicle.findUnique({
          where: { qrShortCode: shortCode },
        });

        if (!vehicle) {
          throw new NotFoundError('Vehicle');
        }

        const response: ApiResponse = {
          success: true,
          data: { vehicle, userId: vehicle.userId },
        };
        return reply.send(response);
      } catch (err) {
        const { statusCode, body } = handleError(err);
        return reply.code(statusCode).send(body);
      }
    },
  );
}
