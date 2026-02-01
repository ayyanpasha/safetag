import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const { api } = await import('../client');
const { getDealerProfile, getReferrals, getPayouts, requestPayout } = await import('../affiliate');

beforeEach(() => vi.clearAllMocks());

describe('affiliate API', () => {
  it('getDealerProfile calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: { dealerCode: 'D1' } });
    await getDealerProfile();
    expect(api.get).toHaveBeenCalledWith('/api/affiliate/profile');
  });

  it('getReferrals calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: [] });
    await getReferrals();
    expect(api.get).toHaveBeenCalledWith('/api/affiliate/referrals');
  });

  it('getPayouts calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: [] });
    await getPayouts();
    expect(api.get).toHaveBeenCalledWith('/api/affiliate/payouts');
  });

  it('requestPayout calls POST', async () => {
    (api.post as any).mockResolvedValue({ success: true, data: { payoutId: 'p1' } });
    const result = await requestPayout();
    expect(api.post).toHaveBeenCalledWith('/api/affiliate/payouts/request');
    expect(result.data?.payoutId).toBe('p1');
  });
});
