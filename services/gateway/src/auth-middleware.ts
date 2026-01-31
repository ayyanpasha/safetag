import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { verifyAccessToken } from '@safetag/service-utils';

const PUBLIC_ROUTES: RegExp[] = [
  /^\/api\/auth\/otp(\/|$)/,
  /^\/api\/scan(\/|$)/,
  /^\/api\/health$/,
];

const SESSION_TOKEN_ROUTES: RegExp[] = [
  /^\/api\/contact(\/|$)/,
  /^\/api\/incidents(\/|$)/,
];

function isPublicRoute(url: string): boolean {
  return PUBLIC_ROUTES.some((pattern) => pattern.test(url));
}

function isSessionTokenRoute(url: string): boolean {
  return SESSION_TOKEN_ROUTES.some((pattern) => pattern.test(url));
}

async function authMiddleware(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const url = request.url.split('?')[0];

    // Public routes — no auth required
    if (isPublicRoute(url)) {
      return;
    }

    // Session token routes — pass through, downstream service validates
    if (isSessionTokenRoute(url)) {
      return;
    }

    // All other routes require owner JWT auth
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.slice(7);

    try {
      const payload = verifyAccessToken(token);

      // Inject user info as headers for downstream services
      request.headers['x-user-id'] = payload.userId;
      request.headers['x-user-role'] = payload.role;
      request.headers['x-user-phone'] = payload.phone;
    } catch {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired access token',
      });
    }
  });
}

export default fp(authMiddleware, {
  name: 'auth-middleware',
});
