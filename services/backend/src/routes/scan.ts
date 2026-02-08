import { FastifyInstance } from 'fastify';
import {
  validateQrCode,
  initiateScan,
  validateSessionToken,
  getSessionByToken,
  getConnectInfo,
  addToBlocklist,
} from '../services/scan.service.js';
import {
  fingerprintRateLimitMiddleware,
  createRouteRateLimit,
  RATE_LIMITS,
} from '../middleware/rate-limit.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  initiatecanSchema,
  validateTokenSchema,
  InitiateScanInput,
} from '../lib/validation.js';

async function scanRoutes(app: FastifyInstance): Promise<void> {
  // Validate QR code (public)
  app.get<{ Params: { shortCode: string } }>(
    '/validate/:shortCode',
    {
      ...createRouteRateLimit(RATE_LIMITS.scan),
    },
    async (request, reply) => {
      const result = await validateQrCode(request.params.shortCode);
      return reply.code(200).send(result);
    }
  );

  // Get connect info (simplified flow - public)
  app.get<{ Params: { shortCode: string } }>(
    '/connect/:shortCode',
    {
      ...createRouteRateLimit(RATE_LIMITS.scan),
    },
    async (request, reply) => {
      const result = await getConnectInfo(request.params.shortCode);
      return reply.code(200).send(result);
    }
  );

  // Initiate scan and generate session token (public with fingerprint rate limit)
  app.post<{ Body: InitiateScanInput }>(
    '/initiate',
    {
      ...createRouteRateLimit(RATE_LIMITS.scan),
      preHandler: [fingerprintRateLimitMiddleware],
    },
    async (request, reply) => {
      const body = initiatecanSchema.parse(request.body);

      const result = await initiateScan(
        body.shortCode,
        body.fingerprint,
        body.latitude,
        body.longitude,
        request.ip
      );

      return reply.code(200).send(result);
    }
  );

  // Validate session token (public)
  app.post<{ Body: { sessionToken: string } }>(
    '/validate-token',
    async (request, reply) => {
      const body = validateTokenSchema.parse(request.body);
      const result = await validateSessionToken(body.sessionToken);
      return reply.code(200).send(result);
    }
  );

  // Get session details by token (public)
  app.get<{ Params: { token: string } }>(
    '/session/:token',
    async (request, reply) => {
      const session = await getSessionByToken(request.params.token);

      if (!session) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Session not found or expired',
        });
      }

      return reply.code(200).send(session);
    }
  );

  // Add device to blocklist (admin only)
  app.post<{ Body: { fingerprint: string; reason: string } }>(
    '/blocklist',
    {
      preHandler: [authMiddleware, requireRole('ADMIN')],
    },
    async (request, reply) => {
      const { fingerprint, reason } = request.body;

      if (!fingerprint || !reason) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'fingerprint and reason are required',
        });
      }

      await addToBlocklist(fingerprint, reason);
      return reply.code(200).send({
        success: true,
        message: 'Device added to blocklist',
      });
    }
  );
}

export default scanRoutes;
