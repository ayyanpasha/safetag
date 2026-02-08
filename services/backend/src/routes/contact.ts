import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import {
  sendWhatsAppComplaint,
  sendVoipOtp,
  initiateVoipCall,
  getCallStatus,
  updateCallStatus,
  getUserConversations,
} from '../services/contact.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { createRouteRateLimit, RATE_LIMITS } from '../middleware/rate-limit.js';
import { redisSub, EVENTS } from '../lib/redis.js';
import {
  whatsappComplaintSchema,
  voipOtpSchema,
  voipInitiateSchema,
  WhatsAppComplaintInput,
  VoipOtpInput,
  VoipInitiateInput,
} from '../lib/validation.js';
import { WebSocket } from 'ws';

// Track connected owners for call notifications
const ownerConnections = new Map<string, WebSocket>();

// Track signaling rooms for WebRTC
const signalingRooms = new Map<string, Set<WebSocket>>();

async function contactRoutes(app: FastifyInstance): Promise<void> {
  // Register WebSocket support
  await app.register(websocket);

  // Send WhatsApp complaint
  app.post<{ Body: WhatsAppComplaintInput }>(
    '/whatsapp/complaint',
    async (request, reply) => {
      const body = whatsappComplaintSchema.parse(request.body);
      const result = await sendWhatsAppComplaint(
        body.sessionToken,
        body.problemType,
        body.message
      );
      return reply.code(200).send(result);
    }
  );

  // Send VoIP OTP
  app.post<{ Body: VoipOtpInput }>(
    '/voip/otp',
    {
      ...createRouteRateLimit(RATE_LIMITS.voip),
    },
    async (request, reply) => {
      const body = voipOtpSchema.parse(request.body);
      const result = await sendVoipOtp(body.sessionToken, body.phone);
      return reply.code(200).send(result);
    }
  );

  // Initiate VoIP call
  app.post<{ Body: VoipInitiateInput }>(
    '/voip/initiate',
    {
      ...createRouteRateLimit(RATE_LIMITS.voip),
    },
    async (request, reply) => {
      const body = voipInitiateSchema.parse(request.body);
      const result = await initiateVoipCall(
        body.sessionToken,
        body.phone,
        body.otp
      );
      return reply.code(200).send(result);
    }
  );

  // Create call session (for two-way signaling)
  app.post<{ Body: { callId: string; ownerId: string } }>(
    '/voip/create-call',
    async (request, reply) => {
      const { callId, ownerId } = request.body;

      if (!callId || !ownerId) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'callId and ownerId are required',
        });
      }

      // Notify owner via WebSocket if connected
      const ownerWs = ownerConnections.get(ownerId);
      if (ownerWs && ownerWs.readyState === WebSocket.OPEN) {
        ownerWs.send(
          JSON.stringify({
            type: 'incoming_call',
            callId,
          })
        );
      }

      return reply.code(200).send({ success: true });
    }
  );

  // Get call status
  app.get<{ Params: { callId: string } }>(
    '/voip/call-status/:callId',
    async (request, reply) => {
      const status = await getCallStatus(request.params.callId);

      if (!status) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Call not found',
        });
      }

      return reply.code(200).send(status);
    }
  );

  // Owner WebSocket for call notifications
  app.get(
    '/voip/owner',
    { websocket: true },
    (socket, request) => {
      const ownerId = (request.query as Record<string, string>).ownerId;

      if (!ownerId) {
        socket.close(4001, 'Missing ownerId');
        return;
      }

      // Store connection
      ownerConnections.set(ownerId, socket);

      socket.on('message', (message: Buffer | string) => {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === 'ping') {
            socket.send(JSON.stringify({ type: 'pong' }));
          } else if (data.type === 'call_response' && data.callId) {
            // Update call status
            updateCallStatus(data.callId, data.action || 'answered');
          }
        } catch {
          // Ignore malformed messages
        }
      });

      socket.on('close', () => {
        ownerConnections.delete(ownerId);
      });

      socket.on('error', () => {
        ownerConnections.delete(ownerId);
      });

      // Send connection confirmation
      socket.send(JSON.stringify({ type: 'connected', ownerId }));
    }
  );

  // WebRTC signaling WebSocket
  app.get(
    '/voip/signal',
    { websocket: true },
    (socket, _request) => {
      let currentRoom: string | null = null;

      socket.on('message', (message: Buffer | string) => {
        try {
          const data = JSON.parse(message.toString());

          switch (data.type) {
            case 'join': {
              const { callId, role } = data;
              if (!callId) break;

              currentRoom = callId;

              // Create room if doesn't exist
              if (!signalingRooms.has(callId)) {
                signalingRooms.set(callId, new Set());
              }

              const room = signalingRooms.get(callId)!;
              room.add(socket);

              // Notify others in room
              for (const peer of room) {
                if (peer !== socket && peer.readyState === WebSocket.OPEN) {
                  peer.send(
                    JSON.stringify({
                      type: 'peer_joined',
                      role,
                    })
                  );
                }
              }

              socket.send(
                JSON.stringify({
                  type: 'joined',
                  callId,
                  peersInRoom: room.size,
                })
              );
              break;
            }

            case 'offer':
            case 'answer':
            case 'ice-candidate': {
              // Relay to other peers in room
              if (!currentRoom) break;

              const room = signalingRooms.get(currentRoom);
              if (!room) break;

              for (const peer of room) {
                if (peer !== socket && peer.readyState === WebSocket.OPEN) {
                  peer.send(JSON.stringify(data));
                }
              }
              break;
            }

            case 'leave': {
              if (currentRoom) {
                const room = signalingRooms.get(currentRoom);
                if (room) {
                  room.delete(socket);
                  if (room.size === 0) {
                    signalingRooms.delete(currentRoom);
                  } else {
                    // Notify remaining peers
                    for (const peer of room) {
                      if (peer.readyState === WebSocket.OPEN) {
                        peer.send(JSON.stringify({ type: 'peer_left' }));
                      }
                    }
                  }
                }
                currentRoom = null;
              }
              break;
            }

            case 'ping': {
              socket.send(JSON.stringify({ type: 'pong' }));
              break;
            }
          }
        } catch {
          // Ignore malformed messages
        }
      });

      socket.on('close', () => {
        if (currentRoom) {
          const room = signalingRooms.get(currentRoom);
          if (room) {
            room.delete(socket);
            if (room.size === 0) {
              signalingRooms.delete(currentRoom);
            } else {
              // Notify remaining peers
              for (const peer of room) {
                if (peer.readyState === WebSocket.OPEN) {
                  peer.send(JSON.stringify({ type: 'peer_left' }));
                }
              }
            }
          }
        }
      });

      socket.on('error', () => {
        if (currentRoom) {
          const room = signalingRooms.get(currentRoom);
          if (room) {
            room.delete(socket);
            if (room.size === 0) {
              signalingRooms.delete(currentRoom);
            }
          }
        }
      });
    }
  );

  // Get user's conversations (authenticated)
  app.get<{ Params: { ownerId: string } }>(
    '/conversations/:ownerId',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      // Verify ownership
      if (request.user!.userId !== request.params.ownerId) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'Cannot access other user conversations',
        });
      }

      const conversations = await getUserConversations(request.params.ownerId);
      return reply.code(200).send({ conversations });
    }
  );
}

// Subscribe to VoIP events for WebSocket notifications
redisSub.subscribe(EVENTS.VOIP_CALL_INITIATED);
redisSub.on('message', (channel: string, message: string) => {
  if (channel === EVENTS.VOIP_CALL_INITIATED) {
    try {
      const data = JSON.parse(message);
      const ownerWs = ownerConnections.get(data.ownerId);

      if (ownerWs && ownerWs.readyState === WebSocket.OPEN) {
        ownerWs.send(
          JSON.stringify({
            type: 'incoming_call',
            callId: data.callId,
            vehicleNumber: data.vehicleNumber,
            dndActive: data.dndActive,
          })
        );
      }
    } catch {
      // Ignore parse errors
    }
  }
});

export default contactRoutes;
