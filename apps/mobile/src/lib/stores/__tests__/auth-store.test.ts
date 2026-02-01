import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock secure storage before importing store
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('@/lib/utils/storage', () => ({
  secureStorage: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}));

const { secureStorage } = await import('@/lib/utils/storage');
const { useAuthStore } = await import('../auth-store');

const mockUser = {
  id: 'u1',
  phone: '+919876543210',
  name: 'Test',
  email: null,
  role: 'OWNER' as const,
  emergencyContact: null,
  dndEnabled: false,
  dndStart: null,
  dndEnd: null,
  createdAt: '2025-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });
});

describe('useAuthStore', () => {
  it('starts with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('login stores refresh token in SecureStore', async () => {
    await useAuthStore.getState().login('access-1', 'refresh-1', mockUser);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-1');
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(secureStorage.set).toHaveBeenCalledWith('refreshToken', 'refresh-1');
  });

  it('setTokens updates access token and persists refresh', async () => {
    await useAuthStore.getState().setTokens('new-access', 'new-refresh');
    expect(useAuthStore.getState().accessToken).toBe('new-access');
    expect(secureStorage.set).toHaveBeenCalledWith('refreshToken', 'new-refresh');
  });

  it('logout clears state and removes refresh token', async () => {
    await useAuthStore.getState().login('a', 'r', mockUser);
    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(secureStorage.remove).toHaveBeenCalledWith('refreshToken');
  });

  it('restoreSession checks for stored refresh token', async () => {
    (secureStorage.get as any).mockResolvedValue(null);
    const result = await useAuthStore.getState().restoreSession();
    expect(result).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('restoreSession returns true when token exists', async () => {
    (secureStorage.get as any).mockResolvedValue('stored-refresh');
    const result = await useAuthStore.getState().restoreSession();
    expect(result).toBe(true);
  });
});
