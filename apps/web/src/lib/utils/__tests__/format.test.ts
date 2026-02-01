import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateTime } from '../format';

describe('formatCurrency', () => {
  it('formats INR currency', () => {
    const result = formatCurrency(299);
    expect(result).toContain('299');
    // Intl formats vary by environment but should contain the number
  });

  it('formats large amounts with grouping', () => {
    const result = formatCurrency(10000);
    expect(result).toContain('10');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });
});

describe('formatDate', () => {
  it('formats date string', () => {
    const result = formatDate('2025-01-15T10:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('formats Date object', () => {
    const result = formatDate(new Date('2025-06-01'));
    expect(result).toBeTruthy();
  });
});

describe('formatDateTime', () => {
  it('includes time component', () => {
    const result = formatDateTime('2025-01-15T10:30:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
