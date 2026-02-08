import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { sanitizeObject } from '../lib/validation.js';

// Security headers configuration (A05 Security Misconfiguration)
export async function registerSecurityHeaders(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss:', 'https:'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    // X-Frame-Options
    frameguard: {
      action: 'deny',
    },
    // X-Content-Type-Options
    noSniff: true,
    // Strict-Transport-Security
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // X-XSS-Protection (legacy but still useful)
    xssFilter: true,
    // Hide X-Powered-By
    hidePoweredBy: true,
    // Referrer-Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    // Permissions-Policy
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
  });
}

// CORS configuration
export async function registerCors(app: FastifyInstance): Promise<void> {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is allowed
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === 'development'
      ) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Session-Token',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });
}

// Request sanitization middleware (A03 Injection)
export async function sanitizeRequestMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  // Sanitize body
  if (request.body && typeof request.body === 'object') {
    request.body = sanitizeObject(request.body as Record<string, unknown>);
  }

  // Sanitize query parameters
  if (request.query && typeof request.query === 'object') {
    request.query = sanitizeObject(request.query as Record<string, unknown>);
  }
}

// Request ID middleware for correlation (A09 Logging Failures)
export async function requestIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const requestId =
    (request.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  request.id = requestId;
  reply.header('X-Request-ID', requestId);
}

// Validate content type for POST/PUT/PATCH requests
export async function contentTypeMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const method = request.method.toUpperCase();

  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentType = request.headers['content-type'] || '';

    // Allow JSON and multipart (for file uploads)
    const allowedTypes = [
      'application/json',
      'multipart/form-data',
      'application/x-www-form-urlencoded',
    ];

    const isAllowed = allowedTypes.some((type) =>
      contentType.toLowerCase().includes(type)
    );

    if (!isAllowed && request.body) {
      return reply.code(415).send({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json or multipart/form-data',
      });
    }
  }
}

// Prevent parameter pollution
export async function parameterPollutionMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  // Convert array query params to single value (take first)
  if (request.query && typeof request.query === 'object') {
    const query = request.query as Record<string, unknown>;
    for (const key of Object.keys(query)) {
      if (Array.isArray(query[key])) {
        query[key] = (query[key] as unknown[])[0];
      }
    }
  }
}
