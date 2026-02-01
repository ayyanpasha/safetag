import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const { api } = await import('../client');
const { sendOtp, verifyOtp, getProfile, updateProfile } = await import('../auth');

beforeEach(() => vi.clearAllMocks());

describe('mobile auth API', () => {
  it('sendOtp calls POST /api/auth/otp/send', async () => {
    (api.post as any).mockResolvedValue({ success: true });
    await sendOtp('+919876543210');
    expect(api.post).toHaveBeenCalledWith('/api/auth/otp/send', { phone: '+919876543210' });
  });

  it('verifyOtp calls POST /api/auth/otp/verify', async () => {
    (api.post as any).mockResolvedValue({ success: true, data: { accessToken: 'a', refreshToken: 'r', user: {} } });
    const result = await verifyOtp('+919876543210', '123456');
    expect(api.post).toHaveBeenCalledWith('/api/auth/otp/verify', { phone: '+919876543210', otp: '123456' });
    expect(result.success).toBe(true);
  });

  it('getProfile calls GET /api/auth/profile', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: { id: 'u1' } });
    await getProfile();
    expect(api.get).toHaveBeenCalledWith('/api/auth/profile');
  });

  it('updateProfile calls PUT /api/auth/profile', async () => {
    (api.put as any).mockResolvedValue({ success: true });
    await updateProfile({ name: 'Test', dndEnabled: true });
    expect(api.put).toHaveBeenCalledWith('/api/auth/profile', { name: 'Test', dndEnabled: true });
  });
});
