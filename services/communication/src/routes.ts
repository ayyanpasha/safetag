import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '../generated/prisma/index.js';
import {
  createLogger,
  handleError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  decryptSessionToken,
} from '@safetag/service-utils';
import { z } from 'zod';
import { sendScannerThankYou, notifyOwner } from './services/whatsapp.js';
import { isDndActive, queueMessage } from './services/dnd.js';

const prisma = new PrismaClient();
const logger = createLogger('communication-routes');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const TURN_SERVER_URL = process.env.TURN_SERVER_URL || 'turn:turn.safetag.local:3478';
const TURN_USERNAME = process.env.TURN_USERNAME || 'safetag';
const TURN_CREDENTIAL = process.env.TURN_CREDENTIAL || 'safetag-credential';

// ─── Auth PreHandler ──────────────────────────────────────
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

// ─── Schemas ─────────────────────────────────────────────

const WhatsAppComplaintSchema = z.object({
  sessionToken: z.string().min(1),
  problemType: z.string().min(1),
  language: z.string().default('en'),
});

const VoipInitiateSchema = z.object({
  sessionToken: z.string().min(1),
  phone: z.string().min(1),
  otp: z.string().min(1),
});

const SendWhatsAppSchema = z.object({
  userId: z.string().uuid(),
  message: z.string().min(1),
  metadata: z.record(z.unknown()).optional(),
});

const CheckDndSchema = z.object({
  userId: z.string().uuid(),
});

// ─── Session Token Type ──────────────────────────────────

interface SessionPayload {
  scannerSessionId: string;
  ownerId: string;
  ownerPhone?: string;
  vehicleId?: string;
  createdAt: string;
  expiresAt: string;
}

// ─── Route Registration ──────────────────────────────────

export function registerRoutes(app: FastifyInstance): void {
  // POST /api/contact/whatsapp/complaint
  app.post('/api/contact/whatsapp/complaint', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = WhatsAppComplaintSchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError(parsed.error.errors[0].message));
        return reply.code(statusCode).send(body);
      }

      const { sessionToken, problemType, language } = parsed.data;

      // Decrypt session token
      let session: SessionPayload;
      try {
        session = decryptSessionToken<SessionPayload>(sessionToken);
      } catch {
        const { statusCode, body } = handleError(new UnauthorizedError('Invalid session token'));
        return reply.code(statusCode).send(body);
      }

      // Validate expiration
      if (new Date(session.expiresAt) < new Date()) {
        const { statusCode, body } = handleError(new UnauthorizedError('Session token has expired'));
        return reply.code(statusCode).send(body);
      }

      // Create conversation record
      const conversation = await prisma.conversation.create({
        data: {
          ownerId: session.ownerId,
          scannerSessionId: session.scannerSessionId,
          channel: 'WHATSAPP',
        },
      });

      // WhatsApp API #1 — scanner-facing thank-you
      const scannerPhone = session.ownerPhone || 'unknown';
      await sendScannerThankYou(scannerPhone, problemType, language);

      // Store scanner-facing message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'OUTBOUND',
          content: `Thank you for reporting: ${problemType}`,
          metadata: { target: 'scanner', problemType, language },
        },
      });

      // WhatsApp API #2 — owner-facing complaint notification
      const ownerMessage = `A person near your vehicle reported a "${problemType}" issue. Please check your vehicle.`;
      const dndActive = await isDndActive(session.ownerId);

      if (dndActive) {
        // Queue message for later delivery
        await queueMessage(session.ownerId, ownerMessage, 'WHATSAPP', {
          conversationId: conversation.id,
          problemType,
        });
        logger.info({ ownerId: session.ownerId }, 'Owner has DND active, message queued');
      } else {
        await notifyOwner(session.ownerId, ownerMessage, {
          conversationId: conversation.id,
          problemType,
        });
      }

      // Store owner-facing message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'OUTBOUND',
          content: ownerMessage,
          metadata: { target: 'owner', problemType, dndQueued: dndActive },
        },
      });

      return reply.send({
        success: true,
        conversationId: conversation.id,
        message: 'Complaint sent',
      });
    } catch (err) {
      logger.error({ err }, 'Failed to process WhatsApp complaint');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // POST /api/contact/voip/initiate
  app.post('/api/contact/voip/initiate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = VoipInitiateSchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError(parsed.error.errors[0].message));
        return reply.code(statusCode).send(body);
      }

      const { sessionToken, phone, otp } = parsed.data;

      // Decrypt session token
      let session: SessionPayload;
      try {
        session = decryptSessionToken<SessionPayload>(sessionToken);
      } catch {
        const { statusCode, body } = handleError(new UnauthorizedError('Invalid session token'));
        return reply.code(statusCode).send(body);
      }

      // Validate expiration
      if (new Date(session.expiresAt) < new Date()) {
        const { statusCode, body } = handleError(new UnauthorizedError('Session token has expired'));
        return reply.code(statusCode).send(body);
      }

      // Verify OTP via auth service
      try {
        const otpResponse = await fetch(`${AUTH_SERVICE_URL}/internal/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, otp }),
        });

        if (!otpResponse.ok) {
          const { statusCode, body } = handleError(new UnauthorizedError('OTP verification failed'));
          return reply.code(statusCode).send(body);
        }
      } catch (err) {
        logger.error({ err }, 'Failed to reach auth service for OTP verification');
        const { statusCode, body } = handleError(new UnauthorizedError('Unable to verify OTP'));
        return reply.code(statusCode).send(body);
      }

      // Check DND
      const dndActive = await isDndActive(session.ownerId);
      if (dndActive) {
        return reply.code(403).send({
          success: false,
          error: 'Owner has DND enabled, please use WhatsApp',
        });
      }

      // Create conversation record
      const conversation = await prisma.conversation.create({
        data: {
          ownerId: session.ownerId,
          scannerSessionId: session.scannerSessionId,
          channel: 'VOIP',
        },
      });

      return reply.send({
        success: true,
        conversationId: conversation.id,
        turnServer: TURN_SERVER_URL,
        turnCredentials: {
          username: TURN_USERNAME,
          credential: TURN_CREDENTIAL,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to initiate VoIP call');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // WebSocket /api/contact/voip/signal — WebRTC signaling relay (auth required)
  app.get('/api/contact/voip/signal', { websocket: true }, (socket, request) => {
    logger.info('WebSocket connection established for VoIP signaling');

    const connections = (app as any).__voipConnections ||= new Map<string, Set<any>>();

    let conversationId: string | null = null;
    let authenticated = false;

    // Require auth as first message
    const authTimeout = setTimeout(() => {
      if (!authenticated) {
        socket.close(1008, 'Authentication timeout');
      }
    }, 10_000);

    socket.on('message', (raw: Buffer) => {
      try {
        const data = JSON.parse(raw.toString());

        // First message must be auth
        if (!authenticated) {
          if (data.type === 'auth' && data.sessionToken) {
            try {
              decryptSessionToken(data.sessionToken);
              authenticated = true;
              clearTimeout(authTimeout);
              socket.send(JSON.stringify({ type: 'auth', success: true }));
              return;
            } catch {
              socket.close(1008, 'Invalid session token');
              return;
            }
          }
          socket.close(1008, 'First message must be auth');
          return;
        }

        if (data.type === 'join' && data.conversationId) {
          conversationId = data.conversationId;
          if (!connections.has(conversationId)) {
            connections.set(conversationId, new Set());
          }
          connections.get(conversationId)!.add(socket);
          logger.info({ conversationId }, 'Peer joined signaling room');
          return;
        }

        // Forward message to other peers in the same conversation
        if (conversationId && connections.has(conversationId)) {
          for (const peer of connections.get(conversationId)!) {
            if (peer !== socket && peer.readyState === 1) {
              peer.send(JSON.stringify(data));
            }
          }
        }
      } catch (err) {
        logger.error({ err }, 'Invalid WebSocket message');
      }
    });

    socket.on('close', () => {
      clearTimeout(authTimeout);
      if (conversationId && connections.has(conversationId)) {
        connections.get(conversationId)!.delete(socket);
        if (connections.get(conversationId)!.size === 0) {
          connections.delete(conversationId);
        }
      }
      logger.info({ conversationId }, 'WebSocket connection closed');
    });
  });

  // GET /api/contact/conversations/:ownerId — list conversations for owner (auth required)
  app.get('/api/contact/conversations/:ownerId', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { ownerId } = request.params as { ownerId: string };
      const userId = (request as any).userId as string;
      if (userId !== ownerId) {
        const { statusCode, body } = handleError(new ForbiddenError('Access denied'));
        return reply.code(statusCode).send(body);
      }

      const conversations = await prisma.conversation.findMany({
        where: { ownerId },
        include: {
          messages: {
            orderBy: { sentAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ success: true, data: conversations });
    } catch (err) {
      logger.error({ err }, 'Failed to fetch conversations');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // Internal: POST /internal/comms/send-whatsapp
  app.post('/internal/comms/send-whatsapp', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = SendWhatsAppSchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError(parsed.error.errors[0].message));
        return reply.code(statusCode).send(body);
      }

      const { userId, message, metadata } = parsed.data;

      const dndActive = await isDndActive(userId);
      if (dndActive) {
        await queueMessage(userId, message, 'WHATSAPP', metadata);
        return reply.send({ success: true, queued: true, message: 'Message queued due to DND' });
      }

      const result = await notifyOwner(userId, message, metadata);
      return reply.send({ success: result.success, queued: false, messageId: result.messageId });
    } catch (err) {
      logger.error({ err }, 'Failed to send internal WhatsApp');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });

  // Internal: POST /internal/comms/check-dnd
  app.post('/internal/comms/check-dnd', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = CheckDndSchema.safeParse(request.body);
      if (!parsed.success) {
        const { statusCode, body } = handleError(new ValidationError(parsed.error.errors[0].message));
        return reply.code(statusCode).send(body);
      }

      const { userId } = parsed.data;
      const active = await isDndActive(userId);

      return reply.send({ success: true, dndActive: active });
    } catch (err) {
      logger.error({ err }, 'Failed to check DND status');
      const { statusCode, body } = handleError(err);
      return reply.code(statusCode).send(body);
    }
  });
}
