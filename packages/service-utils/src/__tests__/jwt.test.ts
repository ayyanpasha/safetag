import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../jwt.js';
import type { TokenPayload } from '../jwt.js';

// Use HMAC mode for tests
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-vitest';
});

const testPayload: TokenPayload = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  phone: '+919876543210',
  role: 'OWNER',
};

describe('generateAccessToken / verifyAccessToken', () => {
  it('generates a valid JWT that can be verified', () => {
    const token = generateAccessToken(testPayload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(testPayload.userId);
    expect(decoded.phone).toBe(testPayload.phone);
    expect(decoded.role).toBe(testPayload.role);
  });

  it('token contains issuer "safetag"', () => {
    const token = generateAccessToken(testPayload);
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    expect(payload.iss).toBe('safetag');
  });
});

describe('generateRefreshToken / verifyRefreshToken', () => {
  it('generates a valid refresh token', () => {
    const token = generateRefreshToken(testPayload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.userId).toBe(testPayload.userId);
  });
});

describe('token expiry', () => {
  it('rejects a tampered token', () => {
    const token = generateAccessToken(testPayload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});
