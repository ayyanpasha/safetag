import { describe, it, expect } from 'vitest';
import { getServiceRoutes } from '../proxy.js';

describe('Proxy Routes', () => {
  it('has 7 service routes configured', () => {
    const routes = getServiceRoutes();
    expect(routes).toHaveLength(7);
  });

  it('has correct prefixes', () => {
    const routes = getServiceRoutes();
    const prefixes = routes.map((r) => r.prefix);
    expect(prefixes).toContain('/api/auth');
    expect(prefixes).toContain('/api/vehicles');
    expect(prefixes).toContain('/api/scan');
    expect(prefixes).toContain('/api/contact');
    expect(prefixes).toContain('/api/payments');
    expect(prefixes).toContain('/api/affiliate');
    expect(prefixes).toContain('/api/incidents');
  });

  it('has upstream URLs for all routes', () => {
    const routes = getServiceRoutes();
    for (const route of routes) {
      expect(route.upstream).toBeTruthy();
      expect(route.upstream).toMatch(/^http/);
    }
  });
});
