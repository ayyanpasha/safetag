import { FastifyInstance } from 'fastify';
import {
  listVehicles,
  createVehicle,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehicleQrCode,
  recordCheckIn,
} from '../services/vehicle.service.js';
import { authMiddleware, sessionTokenMiddleware } from '../middleware/auth.js';
import {
  createVehicleSchema,
  updateVehicleSchema,
  checkInSchema,
  CreateVehicleInput,
  UpdateVehicleInput,
  CheckInInput,
} from '../lib/validation.js';

async function vehicleRoutes(app: FastifyInstance): Promise<void> {
  // List user's vehicles
  app.get(
    '/',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const vehicles = await listVehicles(request.user!.userId);
      return reply.code(200).send({ vehicles });
    }
  );

  // Create new vehicle
  app.post<{ Body: CreateVehicleInput }>(
    '/',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const body = createVehicleSchema.parse(request.body);
      const vehicle = await createVehicle(request.user!.userId, body);
      return reply.code(201).send(vehicle);
    }
  );

  // Get vehicle by ID
  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const vehicle = await getVehicleById(
        request.params.id,
        request.user!.userId
      );
      return reply.code(200).send(vehicle);
    }
  );

  // Update vehicle
  app.patch<{ Params: { id: string }; Body: UpdateVehicleInput }>(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const body = updateVehicleSchema.parse(request.body);
      const vehicle = await updateVehicle(
        request.params.id,
        request.user!.userId,
        body
      );
      return reply.code(200).send(vehicle);
    }
  );

  // Delete vehicle (soft delete)
  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      await deleteVehicle(request.params.id, request.user!.userId);
      return reply.code(200).send({ success: true, message: 'Vehicle deleted' });
    }
  );

  // Get QR code data
  app.get<{ Params: { id: string } }>(
    '/:id/qr',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const qrData = await getVehicleQrCode(
        request.params.id,
        request.user!.userId
      );
      return reply.code(200).send(qrData);
    }
  );

  // Record check-in (requires session token from scan)
  app.post<{ Params: { id: string }; Body: CheckInInput }>(
    '/:id/checkin',
    { preHandler: [sessionTokenMiddleware] },
    async (request, reply) => {
      const body = checkInSchema.parse(request.body);

      // Verify the vehicle ID matches the session
      if (request.sessionData!.vehicleId !== request.params.id) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Session token does not match this vehicle',
        });
      }

      const checkIn = await recordCheckIn(request.params.id, body.location);
      return reply.code(201).send(checkIn);
    }
  );
}

export default vehicleRoutes;
