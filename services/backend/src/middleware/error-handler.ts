import { FastifyInstance, FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { ZodError } from 'zod';

// Custom error classes
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  errors: Array<{ field: string; message: string }>;

  constructor(
    message: string = 'Validation failed',
    errors: Array<{ field: string; message: string }> = []
  ) {
    super(message, 400);
    this.errors = errors;
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

// Generate correlation ID for error tracking (A09 Logging Failures)
function generateCorrelationId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Safe error response (A04 Insecure Design - no stack traces in production)
interface SafeErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  correlationId: string;
  errors?: Array<{ field: string; message: string }>;
  stack?: string;
}

function createSafeErrorResponse(
  error: Error | FastifyError,
  statusCode: number,
  correlationId: string
): SafeErrorResponse {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response: SafeErrorResponse = {
    error: getErrorType(statusCode),
    message: isProduction && statusCode === 500
      ? 'An unexpected error occurred'
      : error.message,
    statusCode,
    correlationId,
  };

  // Include validation errors
  if (error instanceof ValidationError) {
    response.errors = error.errors;
  }

  // Include stack trace in development only
  if (isDevelopment && error.stack) {
    response.stack = error.stack;
  }

  return response;
}

function getErrorType(statusCode: number): string {
  const errorTypes: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    415: 'Unsupported Media Type',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return errorTypes[statusCode] || 'Error';
}

// Structured logging for errors (A09 Logging Failures)
function logError(
  correlationId: string,
  error: Error,
  request: FastifyRequest,
  statusCode: number
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    correlationId,
    level: statusCode >= 500 ? 'error' : 'warn',
    method: request.method,
    url: request.url,
    statusCode,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    userId: request.user?.userId,
    errorName: error.name,
    errorMessage: error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  };

  if (statusCode >= 500) {
    console.error(JSON.stringify(logEntry));
  } else {
    console.warn(JSON.stringify(logEntry));
  }
}

// Register error handler
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    async (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      const correlationId = (request.id as string) || generateCorrelationId();
      let statusCode = 500;

      // Determine status code
      if ('statusCode' in error && typeof error.statusCode === 'number') {
        statusCode = error.statusCode;
      } else if (error instanceof AppError) {
        statusCode = error.statusCode;
      } else if (error instanceof ZodError) {
        statusCode = 400;
      }

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const validationError = new ValidationError(
          'Validation failed',
          error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        );
        logError(correlationId, validationError, request, 400);
        return reply.code(400).send(
          createSafeErrorResponse(validationError, 400, correlationId)
        );
      }

      // Log the error
      logError(correlationId, error, request, statusCode);

      // Send safe response
      return reply
        .code(statusCode)
        .send(createSafeErrorResponse(error, statusCode, correlationId));
    }
  );

  // Handle 404 for unmatched routes
  app.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const correlationId = (request.id as string) || generateCorrelationId();
    const error = new NotFoundError(`Route ${request.method} ${request.url} not found`);

    logError(correlationId, error, request, 404);

    return reply.code(404).send(createSafeErrorResponse(error, 404, correlationId));
  });
}

// Request logging middleware (A09 Logging Failures)
export async function requestLoggingMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: request.id,
    level: 'info',
    type: 'request',
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    userId: request.user?.userId,
    contentLength: request.headers['content-length'],
  };

  console.log(JSON.stringify(logEntry));
}

// Response logging hook
export function registerResponseLogging(app: FastifyInstance): void {
  app.addHook('onResponse', async (request, reply) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId: request.id,
      level: 'info',
      type: 'response',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
      userId: request.user?.userId,
    };

    console.log(JSON.stringify(logEntry));
  });
}
