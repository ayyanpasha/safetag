import { describe, it, expect } from 'vitest';
import { api, authenticate } from './helpers/api-client.js';

/**
 * Integration tests verifying that the API contracts used by both
 * web and mobile apps work correctly against the gateway.
 *
 * These tests exercise the same endpoints that both apps call,
 * ensuring API parity between web (Next.js) and mobile (Expo).
 */

describe('Web + Mobile API Parity', () => {
  let token: string;
  let userId: string;

  it('auth: OTP send + verify returns tokens and user profile', async () => {
    const phone = `+917${Date.now().toString().slice(-9)}`;
    const auth = await authenticate(phone as any);

    token = auth.accessToken;
    userId = auth.user.id;

    expect(auth.accessToken).toBeTruthy();
    expect(auth.refreshToken).toBeTruthy();
    expect(auth.user.phone).toBe(phone);
    expect(auth.user.id).toBeTruthy();
    expect(auth.user.role).toBe('OWNER');
  });

  it('auth: GET /api/auth/me returns UserProfile shape', async () => {
    const res = await api('/api/auth/me', { token });
    expect(res.status).toBe(200);

    const user = res.body.data;
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('phone');
    expect(user).toHaveProperty('role');
    expect(user).toHaveProperty('dndEnabled');
    expect(user).toHaveProperty('createdAt');
  });

  it('auth: PATCH /api/auth/me updates profile fields', async () => {
    const res = await api('/api/auth/me', {
      method: 'PATCH',
      token,
      body: { name: 'Parity Test', dndEnabled: true },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Parity Test');
    expect(res.body.data.dndEnabled).toBe(true);
  });

  it('auth: POST /api/auth/refresh returns new tokens', async () => {
    const authData = await authenticate(`+916${Date.now().toString().slice(-9)}` as any);
    const res = await api('/api/auth/refresh', {
      method: 'POST',
      token: authData.accessToken,
      body: { refreshToken: authData.refreshToken },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
  });

  describe('Vehicle CRUD', () => {
    let vehicleId: string;
    const vehicleNumber = `KA01P${Date.now().toString(36).toUpperCase()}`;

    it('POST /api/vehicles creates a vehicle', async () => {
      const res = await api('/api/vehicles', {
        method: 'POST',
        token,
        body: { vehicleNumber, make: 'Honda', model: 'City', color: 'Silver' },
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      vehicleId = res.body.data.id;
      expect(res.body.data.vehicleNumber).toBe(vehicleNumber);
      expect(res.body.data.qrShortCode).toMatch(/^ST-/);
    });

    it('GET /api/vehicles lists vehicles with expected shape', async () => {
      const res = await api('/api/vehicles', { token });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const v = res.body.data.find((x: any) => x.id === vehicleId);
      expect(v).toBeDefined();
      expect(v).toHaveProperty('vehicleNumber');
      expect(v).toHaveProperty('qrCode');
      expect(v).toHaveProperty('qrShortCode');
      expect(v).toHaveProperty('isActive');
    });

    it('GET /api/vehicles/:id returns vehicle detail', async () => {
      const res = await api(`/api/vehicles/${vehicleId}`, { token });

      expect(res.status).toBe(200);
      expect(res.body.data.vehicleNumber).toBe(vehicleNumber);
      expect(res.body.data.make).toBe('Honda');
    });

    it('GET /api/vehicles/:id/qr returns QR data', async () => {
      const res = await api(`/api/vehicles/${vehicleId}/qr`, { token });

      expect(res.status).toBe(200);
      expect(res.body.data.qrShortCode).toMatch(/^ST-/);
    });

    it('DELETE /api/vehicles/:id deactivates vehicle', async () => {
      const res = await api(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
        token,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Scan Flow', () => {
    let qrShortCode: string;
    let scanVehicleNumber: string;
    let sessionToken: string;

    it('setup: create active vehicle for scanning', async () => {
      scanVehicleNumber = `KA02S${Date.now().toString(36).toUpperCase()}`;
      const createRes = await api('/api/vehicles', {
        method: 'POST',
        token,
        body: { vehicleNumber: scanVehicleNumber },
      });
      expect(createRes.status).toBe(201);

      const qrRes = await api(`/api/vehicles/${createRes.body.data.id}/qr`, { token });
      qrShortCode = qrRes.body.data.qrShortCode;
    });

    it('POST /api/scan/initiate creates session token', async () => {
      const res = await api('/api/scan/initiate', {
        method: 'POST',
        body: {
          shortCode: qrShortCode,
          vehicleNumber: scanVehicleNumber,
          location: { latitude: 12.9716, longitude: 77.5946 },
          fingerprint: 'integration-test',
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      sessionToken = res.body.data.sessionToken;
      expect(sessionToken).toBeTruthy();
    });

    it('POST /api/scan/validate-token validates session', async () => {
      const res = await api('/api/scan/validate-token', {
        method: 'POST',
        body: { sessionToken },
      });

      expect(res.status).toBe(200);
      expect(res.body.data.vehicleNumber).toBe(scanVehicleNumber);
    });
  });

  describe('Error Handling Parity', () => {
    it('returns 401 for requests without token', async () => {
      const res = await api('/api/vehicles');
      expect(res.status).toBe(401);
    });

    it('returns 401 for invalid token', async () => {
      const res = await api('/api/vehicles', { token: 'invalid-jwt-token' });
      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent vehicle', async () => {
      const res = await api('/api/vehicles/00000000-0000-0000-0000-000000000000', { token });
      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid vehicle number format', async () => {
      const res = await api('/api/vehicles', {
        method: 'POST',
        token,
        body: { vehicleNumber: 'ab' },
      });
      expect(res.status).toBe(400);
    });
  });

  describe('Subscription & Billing', () => {
    it('GET /api/payments/subscription returns subscription or empty', async () => {
      const res = await api('/api/payments/subscription', { token });
      // New user may not have subscription — either 200 with data or 200 with null
      expect(res.status).toBe(200);
    });

    it('GET /api/payments/history returns array', async () => {
      const res = await api('/api/payments/history', { token });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Incidents', () => {
    it('GET /api/incidents returns array', async () => {
      const res = await api('/api/incidents', { token });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/incidents?status=OPEN filters by status', async () => {
      const res = await api('/api/incidents?status=OPEN', { token });
      expect(res.status).toBe(200);
      for (const inc of res.body.data ?? []) {
        expect(inc.status).toBe('OPEN');
      }
    });
  });
});
