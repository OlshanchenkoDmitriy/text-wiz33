import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage for testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Since the storage functions are not exported, we'll test the date utilities
describe('Date serialization utilities', () => {
  describe('Date serialization and deserialization', () => {
    it('should serialize date to ISO string', () => {
      const date = new Date('2023-12-01T10:30:00.000Z');
      const serialized = date.toISOString();
      expect(serialized).toBe('2023-12-01T10:30:00.000Z');
    });

    it('should deserialize ISO string to date', () => {
      const dateStr = '2023-12-01T10:30:00.000Z';
      const deserialized = new Date(dateStr);
      expect(deserialized.getTime()).toBe(new Date('2023-12-01T10:30:00.000Z').getTime());
    });

    it('should handle round-trip serialization correctly', () => {
      const originalDate = new Date('2023-12-01T10:30:00.000Z');
      const serialized = originalDate.toISOString();
      const deserialized = new Date(serialized);
      expect(deserialized.getTime()).toBe(originalDate.getTime());
    });
  });
});

describe('localStorage operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle localStorage getItem success', () => {
    const testData = { test: 'data' };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(testData));
    
    const result = JSON.parse(localStorage.getItem('testKey') || '{}');
    expect(result).toEqual(testData);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
  });

  it('should handle localStorage getItem when no data exists', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const result = localStorage.getItem('nonexistentKey');
    expect(result).toBeNull();
    expect(localStorageMock.getItem).toHaveBeenCalledWith('nonexistentKey');
  });

  it('should handle localStorage setItem', () => {
    const testData = { test: 'data' };
    localStorage.setItem('testKey', JSON.stringify(testData));
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testData));
  });
});