import { describe, it, expect } from 'vitest';
import { registerRateLimiting } from '../rate-limit.js';

describe('Rate Limiting', () => {
  it('exports registerRateLimiting function', () => {
    expect(typeof registerRateLimiting).toBe('function');
  });
});
