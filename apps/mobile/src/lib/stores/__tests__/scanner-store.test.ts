import { describe, it, expect, beforeEach } from 'vitest';
import { useScannerStore } from '../scanner-store';

beforeEach(() => {
  useScannerStore.getState().reset();
});

describe('useScannerStore', () => {
  it('starts with null state', () => {
    const state = useScannerStore.getState();
    expect(state.shortCode).toBeNull();
    expect(state.sessionToken).toBeNull();
    expect(state.vehicleNumber).toBeNull();
  });

  it('setShortCode sets shortCode', () => {
    useScannerStore.getState().setShortCode('ST-ABCDE');
    expect(useScannerStore.getState().shortCode).toBe('ST-ABCDE');
  });

  it('setSession populates all fields', () => {
    useScannerStore.getState().setSession({
      sessionToken: 'tok',
      vehicleNumber: 'KA01AB1234',
      make: 'Toyota',
      model: 'Camry',
      color: 'White',
    });

    const state = useScannerStore.getState();
    expect(state.sessionToken).toBe('tok');
    expect(state.vehicleNumber).toBe('KA01AB1234');
    expect(state.vehicleMake).toBe('Toyota');
    expect(state.vehicleModel).toBe('Camry');
    expect(state.vehicleColor).toBe('White');
  });

  it('reset clears all fields', () => {
    useScannerStore.getState().setShortCode('ST-X');
    useScannerStore.getState().setSession({
      sessionToken: 'tok',
      vehicleNumber: 'V1',
      make: null,
      model: null,
      color: null,
    });
    useScannerStore.getState().reset();

    const state = useScannerStore.getState();
    expect(state.shortCode).toBeNull();
    expect(state.sessionToken).toBeNull();
    expect(state.vehicleNumber).toBeNull();
  });
});
