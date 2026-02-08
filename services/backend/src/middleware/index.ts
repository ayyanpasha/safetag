// Barrel export for middleware
export {
  authMiddleware,
  requireRole,
  sessionTokenMiddleware,
  requireOwnership,
  optionalAuthMiddleware,
  type SessionTokenPayload,
} from './auth.js';

export {
  registerRateLimiting,
  createRouteRateLimit,
  fingerprintRateLimitMiddleware,
  RATE_LIMITS,
} from './rate-limit.js';

export {
  registerSecurityHeaders,
  registerCors,
  sanitizeRequestMiddleware,
  requestIdMiddleware,
  contentTypeMiddleware,
  parameterPollutionMiddleware,
} from './security.js';

export {
  registerErrorHandler,
  registerResponseLogging,
  requestLoggingMiddleware,
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from './error-handler.js';
