import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency, maskPhone, formatDuration } from '../format';

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2025-01-15T10:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

describe('formatCurrency', () => {
  it('formats with rupee symbol', () => {
    expect(formatCurrency(299)).toContain('299');
    expect(formatCurrency(299)).toContain('₹');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0');
  });
});

describe('maskPhone', () => {
  it('masks middle digits', () => {
    expect(maskPhone('+919876543210')).toBe('+919****10');
  });

  it('returns short numbers unchanged', () => {
    expect(maskPhone('+91')).toBe('+91');
  });
});

describe('formatDuration', () => {
  it('formats seconds to MM:SS', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(65)).toBe('01:05');
    expect(formatDuration(3661)).toBe('61:01');
  });
});
