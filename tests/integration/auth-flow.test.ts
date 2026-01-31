import { describe, it, expect } from 'vitest';
import { api, authenticate } from './helpers/api-client.js';

describe('Auth Flow', () => {
  it('sends OTP and returns it in dev mode', async () => {
    const res = await api('/api/auth/otp/send', {
      method: 'POST',
      body: { phone: '+919876543210' },
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.otp).toBeDefined();
    expect(res.body.data.otp).toHaveLength(6);
  });

  it('verifies OTP and returns tokens', async () => {
    const auth = await authenticate('+919876543211');

    expect(auth.accessToken).toBeDefined();
    expect(auth.refreshToken).toBeDefined();
    expect(auth.user.phone).toBe('+919876543211');
  });

  it('gets user profile with access token', async () => {
    const auth = await authenticate('+919876543212');

    const res = await api('/api/auth/me', { token: auth.accessToken });

    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe('+919876543212');
  });

  it('updates user profile', async () => {
    const auth = await authenticate('+919876543213');

    const res = await api('/api/auth/me', {
      method: 'PATCH',
      token: auth.accessToken,
      body: { name: 'Integration Test User' },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Integration Test User');
  });

  it('refreshes access token', async () => {
    const auth = await authenticate('+919876543214');

    const res = await api('/api/auth/refresh', {
      method: 'POST',
      token: auth.accessToken,
      body: { refreshToken: auth.refreshToken },
    });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects requests without auth token', async () => {
    const res = await api('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
