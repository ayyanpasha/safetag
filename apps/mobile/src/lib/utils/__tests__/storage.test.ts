import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock expo-secure-store
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

// Mock async-storage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

const SecureStore = await import('expo-secure-store');
const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
const { secureStorage, storage } = await import('../storage');

beforeEach(() => vi.clearAllMocks());

describe('secureStorage', () => {
  it('get calls SecureStore.getItemAsync', async () => {
    (SecureStore.getItemAsync as any).mockResolvedValue('value');
    const result = await secureStorage.get('key');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('key');
    expect(result).toBe('value');
  });

  it('set calls SecureStore.setItemAsync', async () => {
    await secureStorage.set('key', 'value');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('key', 'value');
  });

  it('remove calls SecureStore.deleteItemAsync', async () => {
    await secureStorage.remove('key');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key');
  });
});

describe('storage', () => {
  it('get calls AsyncStorage.getItem', async () => {
    (AsyncStorage.getItem as any).mockResolvedValue('val');
    const result = await storage.get('k');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('k');
    expect(result).toBe('val');
  });

  it('set calls AsyncStorage.setItem', async () => {
    await storage.set('k', 'v');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('k', 'v');
  });

  it('remove calls AsyncStorage.removeItem', async () => {
    await storage.remove('k');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('k');
  });
});
