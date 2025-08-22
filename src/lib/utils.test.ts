import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('should combine class names correctly', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isInactive = false;
    expect(cn('base', isActive && 'active', isInactive && 'inactive')).toBe('base active');
  });

  it('should merge conflicting Tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('should handle arrays and objects', () => {
    expect(cn(['flex', 'items-center'], { 'text-red-500': true, 'text-blue-500': false })).toBe('flex items-center text-red-500');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });
});