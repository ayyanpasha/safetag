import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const { api } = await import('../client');
const { getIncidents, getIncident, updateIncidentStatus } = await import('../incidents');

beforeEach(() => vi.clearAllMocks());

describe('incidents API', () => {
  it('getIncidents without filter', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: [] });
    await getIncidents();
    expect(api.get).toHaveBeenCalledWith('/api/incidents');
  });

  it('getIncidents with status filter', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: [] });
    await getIncidents('OPEN');
    expect(api.get).toHaveBeenCalledWith('/api/incidents?status=OPEN');
  });

  it('getIncident by id', async () => {
    (api.get as any).mockResolvedValue({ success: true, data: { id: 'i1' } });
    await getIncident('i1');
    expect(api.get).toHaveBeenCalledWith('/api/incidents/i1');
  });

  it('updateIncidentStatus sends status', async () => {
    (api.put as any).mockResolvedValue({ success: true });
    await updateIncidentStatus('i1', 'RESOLVED');
    expect(api.put).toHaveBeenCalledWith('/api/incidents/i1', { status: 'RESOLVED' });
  });
});
