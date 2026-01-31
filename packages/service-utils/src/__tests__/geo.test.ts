import { describe, it, expect } from 'vitest';
import { haversineDistance } from '../geo.js';

describe('haversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(haversineDistance(12.9716, 77.5946, 12.9716, 77.5946)).toBe(0);
  });

  it('calculates distance between Bangalore and Mumbai (~840 km)', () => {
    const distance = haversineDistance(12.9716, 77.5946, 19.076, 72.8777);
    // ~840 km, allow 5% tolerance
    expect(distance).toBeGreaterThan(800_000);
    expect(distance).toBeLessThan(900_000);
  });

  it('calculates distance between two nearby points (~1.1 km)', () => {
    // Approximately 1 km apart
    const distance = haversineDistance(12.9716, 77.5946, 12.9806, 77.5946);
    expect(distance).toBeGreaterThan(900);
    expect(distance).toBeLessThan(1200);
  });

  it('handles antipodal points (~20000 km)', () => {
    const distance = haversineDistance(0, 0, 0, 180);
    // Half circumference of Earth ≈ 20015 km
    expect(distance).toBeGreaterThan(19_000_000);
    expect(distance).toBeLessThan(21_000_000);
  });

  it('handles negative coordinates', () => {
    const distance = haversineDistance(-33.8688, 151.2093, -37.8136, 144.9631);
    // Sydney to Melbourne ~714 km
    expect(distance).toBeGreaterThan(650_000);
    expect(distance).toBeLessThan(800_000);
  });
});
