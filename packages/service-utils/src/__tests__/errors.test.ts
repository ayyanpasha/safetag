import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  handleError,
} from '../errors.js';

describe('AppError', () => {
  it('sets message, statusCode, and code', () => {
    const err = new AppError('test error', 422, 'TEST');
    expect(err.message).toBe('test error');
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('TEST');
    expect(err.name).toBe('AppError');
    expect(err).toBeInstanceOf(Error);
  });

  it('defaults to 500', () => {
    const err = new AppError('server error');
    expect(err.statusCode).toBe(500);
  });
});

describe('NotFoundError', () => {
  it('has 404 status and NOT_FOUND code', () => {
    const err = new NotFoundError('Vehicle');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Vehicle not found');
  });

  it('defaults to "Resource"', () => {
    const err = new NotFoundError();
    expect(err.message).toBe('Resource not found');
  });
});

describe('UnauthorizedError', () => {
  it('has 401 status', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });
});

describe('ForbiddenError', () => {
  it('has 403 status', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});

describe('ValidationError', () => {
  it('has 400 status', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('bad input');
  });
});

describe('handleError', () => {
  it('handles AppError subclasses', () => {
    const result = handleError(new NotFoundError('User'));
    expect(result.statusCode).toBe(404);
    expect(result.body).toEqual({
      success: false,
      error: 'User not found',
      code: 'NOT_FOUND',
    });
  });

  it('handles generic Error', () => {
    const result = handleError(new Error('something broke'));
    expect(result.statusCode).toBe(500);
    expect(result.body).toEqual({
      success: false,
      error: 'something broke',
    });
  });

  it('handles non-Error values', () => {
    const result = handleError('string error');
    expect(result.statusCode).toBe(500);
    expect(result.body).toEqual({
      success: false,
      error: 'Internal server error',
    });
  });
});
