import { describe, it, expect, beforeAll } from 'vitest';
import { encryptSessionToken, decryptSessionToken } from '../crypto.js';

beforeAll(() => {
  process.env.SESSION_ENCRYPTION_KEY = 'test-encryption-key-for-vitest!!';
});

describe('encryptSessionToken / decryptSessionToken', () => {
  it('round-trips a payload correctly', () => {
    const payload = {
      vehicleNumber: 'KA01AB1234',
      lat: 12.9716,
      lng: 77.5946,
      ownerId: '550e8400-e29b-41d4-a716-446655440000',
      vehicleId: '660e8400-e29b-41d4-a716-446655440001',
      exp: Date.now() + 30 * 60 * 1000,
    };

    const token = encryptSessionToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);

    const decrypted = decryptSessionToken<typeof payload>(token);
    expect(decrypted.vehicleNumber).toBe('KA01AB1234');
    expect(decrypted.lat).toBe(12.9716);
    expect(decrypted.ownerId).toBe(payload.ownerId);
    expect(decrypted.exp).toBe(payload.exp);
  });

  it('produces different ciphertexts for the same payload (random IV)', () => {
    const payload = { test: 'data' };
    const token1 = encryptSessionToken(payload);
    const token2 = encryptSessionToken(payload);
    expect(token1).not.toBe(token2);
  });

  it('throws on tampered ciphertext', () => {
    const payload = { test: 'data' };
    const token = encryptSessionToken(payload);

    // Flip a character
    const tampered = token.slice(0, 10) + 'X' + token.slice(11);
    expect(() => decryptSessionToken(tampered)).toThrow();
  });

  it('throws on completely invalid input', () => {
    expect(() => decryptSessionToken('not-a-valid-token')).toThrow();
  });
});
