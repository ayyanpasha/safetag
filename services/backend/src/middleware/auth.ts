import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, DecodedToken } from '../lib/jwt.js';
import { decryptSessionToken } from '../lib/crypto.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: DecodedToken;
    sessionData?: SessionTokenPayload;
  }
}

export interface SessionTokenPayload {
  vehicleId: string;
  ownerId: string;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
  exp: number;
}

// JWT Bearer token authentication middleware (A01, A07)
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Token verification failed';
    return reply.code(401).send({
      error: 'Unauthorized',
      message,
    });
  }
}

// Role-based access control middleware (A01 Broken Access Control)
export function requireRole(...allowedRoles: Array<'OWNER' | 'DEALER' | 'ADMIN'>) {
  return async function roleMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
}

// Session token authentication (for scanner endpoints)
export async function sessionTokenMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Try to get session token from header or body
  const sessionToken =
    request.headers['x-session-token'] as string ||
    (request.body as Record<string, unknown>)?.sessionToken as string;

  if (!sessionToken) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Session token required',
    });
  }

  try {
    const sessionData = decryptSessionToken<SessionTokenPayload>(sessionToken);

    // Check expiration
    if (Date.now() > sessionData.exp) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Session token expired',
      });
    }

    request.sessionData = sessionData;
  } catch {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid session token',
    });
  }
}

// Resource ownership check (A01 Broken Access Control)
export function requireOwnership(
  getResourceUserId: (request: FastifyRequest) => Promise<string | null>
) {
  return async function ownershipMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    // Admins can access any resource
    if (request.user.role === 'ADMIN') {
      return;
    }

    const resourceUserId = await getResourceUserId(request);

    if (!resourceUserId) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Resource not found',
      });
    }

    if (resourceUserId !== request.user.userId) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'You do not have access to this resource',
      });
    }
  };
}

// Optional auth - populates user if token present but doesn't fail
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
}
