import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn().mockResolvedValue('refresh-token'),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('@/lib/utils/storage', () => ({
  secureStorage: {
    get: vi.fn().mockResolvedValue('refresh-token'),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/constants/config', () => ({
  API_URL: 'http://test-api.com',
}));

vi.mock('@/lib/stores/auth-store', () => {
  const state = {
    accessToken: 'test-token',
    setTokens: vi.fn(),
    logout: vi.fn(),
  };
  return {
    useAuthStore: {
      getState: () => state,
      setState: (s: any) => Object.assign(state, s),
      __mock: state,
    },
  };
});

const { useAuthStore } = await import('@/lib/stores/auth-store');
const mockState = (useAuthStore as any).__mock;

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const { api } = await import('../client');

beforeEach(() => {
  vi.clearAllMocks();
  mockState.accessToken = 'test-token';
});

describe('Mobile ApiClient', () => {
  it('GET sets Authorization header from store', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    await api.get('/api/vehicles');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://test-api.com/api/vehicles',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('POST sends JSON body', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await api.post('/api/auth/otp/send', { phone: '+919876543210' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phone: '+919876543210' }),
      }),
    );
  });

  it('retries on 401 with token refresh', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { accessToken: 'new-a', refreshToken: 'new-r' },
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ success: true, data: 'retried' }),
      });

    const result = await api.get('/api/vehicles');

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.data).toBe('retried');
  });

  it('calls logout when refresh fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ ok: false });

    const result = await api.get('/api/vehicles');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session expired');
    expect(mockState.logout).toHaveBeenCalled();
  });

  it('upload sends FormData without Content-Type', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    const fd = new FormData();
    await api.upload('/api/contact/emergency', fd);

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBeUndefined();
  });
});
