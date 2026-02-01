import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const { api } = await import('../client');
const { validateQR, initiateScan } = await import('../scanner');

beforeEach(() => vi.clearAllMocks());

describe('mobile scanner API', () => {
  it('validateQR calls GET with shortCode', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: { valid: true } });
    const result = await validateQR('ST-ABCDE');
    expect(api.get).toHaveBeenCalledWith('/api/scan/validate/ST-ABCDE');
    expect(result.data?.valid).toBe(true);
  });

  it('validateQR returns invalid', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: { valid: false } });
    const result = await validateQR('INVALID');
    expect(result.data?.valid).toBe(false);
  });

  it('initiateScan sends all fields', async () => {
    (api.post as any).mockResolvedValue({ success: true, data: { sessionToken: 'tok' } });
    await initiateScan({
      shortCode: 'ST-ABCDE',
      vehicleNumber: 'KA01AB1234',
      location: { latitude: 12.97, longitude: 77.59 },
      fingerprint: 'mobile-app',
    });
    expect(api.post).toHaveBeenCalledWith('/api/scan/initiate', {
      shortCode: 'ST-ABCDE',
      vehicleNumber: 'KA01AB1234',
      location: { latitude: 12.97, longitude: 77.59 },
      fingerprint: 'mobile-app',
    });
  });
});
