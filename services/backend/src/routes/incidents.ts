import { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import {
  reportEmergency,
  getUserIncidents,
  getIncidentById,
  updateIncidentStatus,
  getPhotoUploadUrl,
  EmergencyType,
} from '../services/incident.service.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  emergencyReportSchema,
  updateIncidentStatusSchema,
  UpdateIncidentStatusInput,
} from '../lib/validation.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function incidentRoutes(app: FastifyInstance): Promise<void> {
  // Register multipart support for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: MAX_FILE_SIZE,
      files: 1,
    },
  });

  // Report emergency incident (requires session token)
  app.post(
    '/emergency',
    async (request, reply) => {
      // Handle multipart form data
      const parts = request.parts();
      const formData: Record<string, string> = {};
      let photoBuffer: Buffer | undefined;
      let photoMimeType: string | undefined;

      for await (const part of parts) {
        if (part.type === 'file') {
          // Validate file type
          if (!part.mimetype.startsWith('image/')) {
            return reply.code(400).send({
              error: 'Bad Request',
              message: 'Only image files are allowed',
            });
          }
          photoBuffer = await part.toBuffer();
          photoMimeType = part.mimetype;
        } else {
          formData[part.fieldname] = part.value as string;
        }
      }

      // Validate form data
      const body = emergencyReportSchema.parse({
        sessionToken: formData.sessionToken,
        phone: formData.phone,
        otp: formData.otp,
        emergencyType: formData.emergencyType,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });

      const result = await reportEmergency(
        body.sessionToken,
        body.phone,
        body.otp,
        body.emergencyType as EmergencyType,
        body.latitude,
        body.longitude,
        photoBuffer && photoMimeType
          ? { buffer: photoBuffer, mimeType: photoMimeType }
          : undefined
      );

      return reply.code(201).send(result);
    }
  );

  // Get presigned URL for photo upload (alternative method)
  app.get(
    '/upload-url',
    { preHandler: [authMiddleware] },
    async (_request, reply) => {
      const result = await getPhotoUploadUrl();
      return reply.code(200).send(result);
    }
  );

  // List user's incidents (authenticated)
  app.get<{ Querystring: { page?: string; limit?: string } }>(
    '/',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const page = parseInt(request.query.page || '1', 10);
      const limit = parseInt(request.query.limit || '20', 10);

      const result = await getUserIncidents(request.user!.userId, page, limit);
      return reply.code(200).send(result);
    }
  );

  // Get incident by ID (authenticated)
  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const incident = await getIncidentById(
        request.params.id,
        request.user!.userId
      );
      return reply.code(200).send(incident);
    }
  );

  // Update incident status (authenticated)
  app.patch<{ Params: { id: string }; Body: UpdateIncidentStatusInput }>(
    '/:id/status',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const body = updateIncidentStatusSchema.parse(request.body);
      const incident = await updateIncidentStatus(
        request.params.id,
        request.user!.userId,
        body.status
      );
      return reply.code(200).send(incident);
    }
  );
}

export default incidentRoutes;
