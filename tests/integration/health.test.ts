import { describe, it, expect } from 'vitest';
import { api } from './helpers/api-client.js';

describe('Health Checks', () => {
  it('gateway aggregated health returns all services', async () => {
    const res = await api('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.gateway).toBe('healthy');
    expect(res.body.services).toBeDefined();
  });

  const services = [
    { name: 'auth', port: 3001 },
    { name: 'vehicle', port: 3002 },
    { name: 'sheriff', port: 3003 },
    { name: 'communication', port: 3004 },
    { name: 'payment', port: 3005 },
    { name: 'affiliate', port: 3006 },
    { name: 'incident', port: 3007 },
  ];

  for (const svc of services) {
    it(`${svc.name} service is healthy on port ${svc.port}`, async () => {
      const res = await fetch(`http://localhost:${svc.port}/health`);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('ok');
      expect(body.service).toBe(svc.name);
    });
  }
});
