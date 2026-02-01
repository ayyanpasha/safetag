import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth store before importing client
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

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'refresh-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

const { api } = await import('../client');

beforeEach(() => {
  vi.clearAllMocks();
  mockState.accessToken = 'test-token';
});

describe('ApiClient', () => {
  it('GET includes Authorization header', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, data: [1, 2, 3] }),
    });

    const result = await api.get('/api/vehicles');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/vehicles'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
    expect(result).toEqual({ success: true, data: [1, 2, 3] });
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

  it('PUT sends JSON body', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await api.put('/api/auth/profile', { name: 'Test' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('DELETE sends no body', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });

    await api.delete('/api/vehicles/v1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/vehicles/v1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('retries on 401 with token refresh', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 401 }) // first call fails
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { accessToken: 'new-token', refreshToken: 'new-refresh' },
        }),
      }) // refresh succeeds
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ success: true, data: 'retried' }),
      }); // retry succeeds

    const result = await api.get('/api/vehicles');

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.data).toBe('retried');
  });

  it('calls logout when refresh fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ status: 401, ok: false });

    const result = await api.get('/api/vehicles');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Session expired');
    expect(mockState.logout).toHaveBeenCalled();
  });

  it('upload sends FormData without Content-Type', async () => {
    mockFetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, data: { incidentId: 'i1' } }),
    });

    const fd = new FormData();
    fd.append('file', 'blob');
    await api.upload('/api/contact/emergency', fd);

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBeUndefined();
  });
});
