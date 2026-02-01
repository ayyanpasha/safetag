import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../auth-store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

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
  useAuthStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
  });
  localStorageMock.clear();
});

describe('useAuthStore', () => {
  it('starts with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('login sets tokens, user, and isAuthenticated', () => {
    useAuthStore.getState().login('access-123', 'refresh-456', mockUser);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-123');
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-456');
  });

  it('setTokens updates access token and stores refresh', () => {
    useAuthStore.getState().setTokens('new-access', 'new-refresh');

    expect(useAuthStore.getState().accessToken).toBe('new-access');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh');
  });

  it('setUser updates only user', () => {
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('logout clears everything', () => {
    useAuthStore.getState().login('a', 'r', mockUser);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });
});
