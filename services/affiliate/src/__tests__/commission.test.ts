import { describe, it, expect, vi } from 'vitest';

// Mock dependencies that commission.ts imports
vi.mock('../../generated/prisma/index.js', () => ({
  PrismaClient: class { constructor() { return {}; } },
}));

vi.mock('@safetag/service-utils', () => ({
  createLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn() }),
  subscribeToEvent: vi.fn(),
}));

const { calculateCommission } = await import('../services/commission.js');

describe('calculateCommission', () => {
  it('payment 1: 20% commission', () => {
    const result = calculateCommission(1, 1000);
    expect(result.percent).toBe(20);
    expect(result.commission).toBe(200);
  });

  it('payment 2: 10% commission', () => {
    const result = calculateCommission(2, 1000);
    expect(result.percent).toBe(10);
    expect(result.commission).toBe(100);
  });

  it('payment 3: 10% commission', () => {
    const result = calculateCommission(3, 500);
    expect(result.percent).toBe(10);
    expect(result.commission).toBe(50);
  });

  it('payment 4+: 0% commission', () => {
    expect(calculateCommission(4, 1000)).toEqual({ percent: 0, commission: 0 });
    expect(calculateCommission(10, 1000)).toEqual({ percent: 0, commission: 0 });
  });

  it('rounds commission to nearest integer', () => {
    const result = calculateCommission(1, 299);
    expect(result.commission).toBe(Math.round(299 * 0.2)); // 60
  });

  it('handles zero amount', () => {
    expect(calculateCommission(1, 0)).toEqual({ percent: 20, commission: 0 });
  });
});
