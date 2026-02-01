import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const { api } = await import('../client');
const { getSubscription, createSubscription, getBillingHistory } = await import('../payments');

beforeEach(() => vi.clearAllMocks());

describe('payments API', () => {
  it('getSubscription calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: { plan: 'MONTHLY' } });
    await getSubscription();
    expect(api.get).toHaveBeenCalledWith('/api/payments/subscription');
  });

  it('createSubscription sends plan and vehicleId', async () => {
    (api.post as any).mockResolvedValue({ success: true });
    await createSubscription('QUARTERLY', 'v1');
    expect(api.post).toHaveBeenCalledWith('/api/payments/subscribe', { plan: 'QUARTERLY', vehicleId: 'v1' });
  });

  it('getBillingHistory calls correct endpoint', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: [] });
    await getBillingHistory();
    expect(api.get).toHaveBeenCalledWith('/api/payments/history');
  });
});
