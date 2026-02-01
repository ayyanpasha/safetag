import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const { api } = await import('../client');
const { getVehicles, getVehicle, createVehicle, deleteVehicle } = await import('../vehicles');

beforeEach(() => vi.clearAllMocks());

describe('vehicles API', () => {
  it('getVehicles calls GET /api/vehicles', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: [] });
    await getVehicles();
    expect(api.get).toHaveBeenCalledWith('/api/vehicles');
  });

  it('getVehicle calls GET /api/vehicles/:id', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: { id: 'v1' } });
    await getVehicle('v1');
    expect(api.get).toHaveBeenCalledWith('/api/vehicles/v1');
  });

  it('createVehicle calls POST with payload', async () => {
    (api.post as any).mockResolvedValue({ success: true });
    await createVehicle({ vehicleNumber: 'KA01AB1234', make: 'Toyota' });
    expect(api.post).toHaveBeenCalledWith('/api/vehicles', {
      vehicleNumber: 'KA01AB1234',
      make: 'Toyota',
    });
  });

  it('deleteVehicle calls DELETE /api/vehicles/:id', async () => {
    (api.delete as any).mockResolvedValue({ success: true });
    await deleteVehicle('v1');
    expect(api.delete).toHaveBeenCalledWith('/api/vehicles/v1');
  });
});
