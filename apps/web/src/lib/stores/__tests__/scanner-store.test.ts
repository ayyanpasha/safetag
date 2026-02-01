import { describe, it, expect, beforeEach } from 'vitest';
import { useScannerStore } from '../scanner-store';

beforeEach(() => {
  useScannerStore.getState().clear();
});

describe('useScannerStore', () => {
  it('starts with null state', () => {
    const state = useScannerStore.getState();
    expect(state.sessionToken).toBeNull();
    expect(state.vehicleNumber).toBeNull();
    expect(state.shortCode).toBeNull();
  });

  it('setSession populates all fields', () => {
    useScannerStore.getState().setSession({
      sessionToken: 'tok-123',
      vehicleNumber: 'KA01AB1234',
      make: 'Toyota',
      model: 'Camry',
      color: 'White',
      shortCode: 'ST-ABCDE',
    });

    const state = useScannerStore.getState();
    expect(state.sessionToken).toBe('tok-123');
    expect(state.vehicleNumber).toBe('KA01AB1234');
    expect(state.make).toBe('Toyota');
    expect(state.shortCode).toBe('ST-ABCDE');
  });

  it('clear resets all fields', () => {
    useScannerStore.getState().setSession({
      sessionToken: 'tok',
      vehicleNumber: 'KA01',
      make: null,
      model: null,
      color: null,
      shortCode: 'ST-X',
    });
    useScannerStore.getState().clear();

    const state = useScannerStore.getState();
    expect(state.sessionToken).toBeNull();
    expect(state.vehicleNumber).toBeNull();
    expect(state.shortCode).toBeNull();
  });
});
