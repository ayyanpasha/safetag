import { describe, it, expect } from 'vitest';
import { api, authenticate } from './helpers/api-client.js';

describe('Vehicle Flow', () => {
  let token: string;
  let vehicleId: string;
  const vehicleNumber = `KA01V${Date.now().toString(36).toUpperCase()}`;

  it('authenticates user', async () => {
    const phone = `+916${Date.now().toString().slice(-9)}`;
    const auth = await authenticate(phone as any);
    token = auth.accessToken;
    expect(token).toBeDefined();
  });

  it('creates a vehicle', async () => {
    const res = await api('/api/vehicles', {
      method: 'POST',
      token,
      body: { vehicleNumber },
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    vehicleId = res.body.data.id;
    expect(vehicleId).toBeDefined();
  });

  it('lists vehicles', async () => {
    const res = await api('/api/vehicles', { token });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.some((v: any) => v.vehicleNumber === vehicleNumber)).toBe(true);
  });

  it('gets vehicle detail', async () => {
    const res = await api(`/api/vehicles/${vehicleId}`, { token });

    expect(res.status).toBe(200);
    expect(res.body.data.vehicleNumber).toBe(vehicleNumber);
  });

  it('gets QR code data', async () => {
    const res = await api(`/api/vehicles/${vehicleId}/qr`, { token });

    expect(res.status).toBe(200);
    expect(res.body.data.qrShortCode).toMatch(/^ST-/);
    expect(res.body.data.qrUrl).toContain('safetag.in/s/');
  });

  it('deletes (deactivates) vehicle', async () => {
    const res = await api(`/api/vehicles/${vehicleId}`, {
      method: 'DELETE',
      token,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
