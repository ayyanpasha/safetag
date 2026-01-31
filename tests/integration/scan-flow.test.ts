import { describe, it, expect } from 'vitest';
import { api, authenticate } from './helpers/api-client.js';

describe('Scan Flow', () => {
  let token: string;
  let vehicleId: string;
  let qrShortCode: string;
  let vehicleNumber: string;
  let sessionToken: string;

  it('authenticates and creates a vehicle', async () => {
    const phone = `+917${Date.now().toString().slice(-9)}`;
    const auth = await authenticate(phone as any);
    token = auth.accessToken;

    vehicleNumber = `KA01S${Date.now().toString(36).toUpperCase()}`;
    const res = await api('/api/vehicles', {
      method: 'POST',
      token,
      body: { vehicleNumber },
    });

    expect(res.status).toBe(201);
    vehicleId = res.body.data.id;

    const qrRes = await api(`/api/vehicles/${vehicleId}/qr`, { token });
    qrShortCode = qrRes.body.data.qrShortCode;
    expect(qrShortCode).toMatch(/^ST-/);
  });

  it('initiates a scan with QR short code', async () => {
    const res = await api('/api/scan/initiate', {
      method: 'POST',
      body: {
        shortCode: qrShortCode,
        vehicleNumber,
        location: { latitude: 12.9716, longitude: 77.5946 },
        fingerprint: 'test-fp-001',
      },
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    sessionToken = res.body.data.sessionToken;
    expect(sessionToken).toBeDefined();
  });

  it('validates the session token', async () => {
    const res = await api('/api/scan/validate-token', {
      method: 'POST',
      body: { sessionToken },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.vehicleNumber).toBe(vehicleNumber);
  });
});
