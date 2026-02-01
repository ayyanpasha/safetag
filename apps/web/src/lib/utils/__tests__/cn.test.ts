import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end');
  });

  it('deduplicates tailwind conflicts', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6');
  });

  it('handles undefined and null', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b');
  });

  it('returns empty string for no input', () => {
    expect(cn()).toBe('');
  });
});
