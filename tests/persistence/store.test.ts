import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadScene, saveScene, clearSavedScene, type StorageAdapter } from '../../src/persistence/store';
import { parseScenario } from '../../src/domain/schema';
import type { Scenario } from '../../src/domain/types';

// Valid minimal Scenario for testing - must match actual Scenario shape
const minimalScenario: Scenario = {
  version: 1,
  title: 'Test Scene',
  zones: [{ id: 'z1', name: 'Zone 1' }],
  holders: [],
  props: [],
  cues: []
};

// Validate that fixture passes parser
const parseResult = parseScenario(minimalScenario);
if (!parseResult.success) {
  throw new Error(`Test fixture failed parser validation: ${parseResult.errors.join(', ')}`);
}

describe('store localStorage protection', () => {
  let originalDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    // Capture original localStorage descriptor
    originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  });

  afterEach(() => {
    // Restore original localStorage property descriptor
    if (originalDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  describe('loadScene', () => {
    it('catches denied global localStorage getter', () => {
      // Make localStorage getter throw
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('SecurityError: localStorage access denied');
        },
        configurable: true
      });

      const result = loadScene();
      
      expect(result.success).toBe(false);
      if (!result.success && result.reason === 'storage-denied') {
        expect(result.error).toContain('localStorage access denied');
      } else {
        throw new Error('Expected storage-denied result');
      }
    });

    it('bypasses global getter when adapter is injected', () => {
      // Make global getter throw
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('Should not access global');
        },
        configurable: true
      });

      const mockAdapter: StorageAdapter = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      };

      const result = loadScene(mockAdapter);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not-found');
      }
    });

    it('handles healthy omitted adapter (undefined)', () => {
      const mockStorage: StorageAdapter = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      };

      // Temporarily replace global localStorage with mock
      Object.defineProperty(globalThis, 'localStorage', {
        value: mockStorage,
        configurable: true,
        writable: true
      });

      const result = loadScene(undefined);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not-found');
      }
    });

    it('catches adapter method exceptions', () => {
      const throwingAdapter: StorageAdapter = {
        getItem: () => {
          throw new Error('Adapter getItem failure');
        },
        setItem: () => {},
        removeItem: () => {}
      };

      const result = loadScene(throwingAdapter);
      
      expect(result.success).toBe(false);
      if (!result.success && result.reason === 'storage-denied') {
        expect(result.error).toContain('Adapter getItem failure');
      } else {
        throw new Error('Expected storage-denied result');
      }
    });
  });

  describe('saveScene', () => {
    it('catches denied global localStorage getter', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('SecurityError: localStorage access denied');
        },
        configurable: true
      });

      const result = saveScene(minimalScenario);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('storage-denied');
        expect(result.error).toContain('localStorage access denied');
      }
    });

    it('bypasses global getter when adapter is injected', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('Should not access global');
        },
        configurable: true
      });

      const mockAdapter: StorageAdapter = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      };

      const result = saveScene(minimalScenario, mockAdapter);
      
      expect(result.success).toBe(true);
    });

    it('handles healthy omitted adapter (undefined)', () => {
      const mockStorage: StorageAdapter = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      };

      Object.defineProperty(globalThis, 'localStorage', {
        value: mockStorage,
        configurable: true,
        writable: true
      });

      const result = saveScene(minimalScenario, undefined);
      
      expect(result.success).toBe(true);
    });

    it('catches adapter method exceptions', () => {
      const throwingAdapter: StorageAdapter = {
        getItem: () => null,
        setItem: () => {
          throw new Error('Adapter setItem failure');
        },
        removeItem: () => {}
      };

      const result = saveScene(minimalScenario, throwingAdapter);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('storage-denied');
        expect(result.error).toContain('Adapter setItem failure');
      }
    });

    it('distinguishes quota-exceeded from other errors', () => {
      const quotaAdapter: StorageAdapter = {
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError: Storage quota exceeded');
        },
        removeItem: () => {}
      };

      const result = saveScene(minimalScenario, quotaAdapter);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('quota-exceeded');
        expect(result.error).toContain('QuotaExceeded');
      }
    });
  });

  describe('clearSavedScene', () => {
    it('catches denied global localStorage getter', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('SecurityError: localStorage access denied');
        },
        configurable: true
      });

      const result = clearSavedScene();
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('storage-denied');
        expect(result.error).toContain('localStorage access denied');
      }
    });

    it('bypasses global getter when adapter is injected', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('Should not access global');
        },
        configurable: true
      });

      const mockAdapter: StorageAdapter = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      };

      const result = clearSavedScene(mockAdapter);
      
      expect(result.success).toBe(true);
    });

    it('handles healthy omitted adapter (undefined)', () => {
      const mockStorage: StorageAdapter = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      };

      Object.defineProperty(globalThis, 'localStorage', {
        value: mockStorage,
        configurable: true,
        writable: true
      });

      const result = clearSavedScene(undefined);
      
      expect(result.success).toBe(true);
    });

    it('catches adapter method exceptions', () => {
      const throwingAdapter: StorageAdapter = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {
          throw new Error('Adapter removeItem failure');
        }
      };

      const result = clearSavedScene(throwingAdapter);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('storage-denied');
        expect(result.error).toContain('Adapter removeItem failure');
      }
    });
  });
});
