// Test setup file

import { vi } from 'vitest';

// Mock Chrome API
const chrome = {
  runtime: {
    id: 'test-extension-id',
    sendMessage: vi.fn().mockResolvedValue({}),
    onMessage: {
      addListener: vi.fn(),
    },
    getManifest: vi.fn(() => ({
      version: '1.0.0',
      name: 'PrivateTab',
    })),
    onInstalled: {
      addListener: vi.fn(),
    },
  },
  notifications: {
    create: vi.fn().mockResolvedValue('notification-id'),
    clear: vi.fn().mockResolvedValue(true),
  },
  action: {
    setBadgeText: vi.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
    sendMessage: vi.fn(),
    onActivated: {
      addListener: vi.fn(),
    },
    onRemoved: {
      addListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
    },
  },
  scripting: {
    executeScript: vi.fn(),
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
    },
  },
};

// Set global chrome object
globalThis.chrome = chrome as any;

// Mock Web Crypto API for password hashing tests
const mockSubtle = {
  importKey: vi.fn().mockResolvedValue({} as CryptoKey),
  deriveBits: vi.fn().mockImplementation(async (_algorithm: any, _key: any, length: number) => {
    // Simple mock that returns predictable bytes for testing
    const buffer = new ArrayBuffer(length / 8);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < view.length; i++) {
      view[i] = i % 256;
    }
    return buffer;
  }),
  digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
};

// Only override crypto if possible
try {
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        },
        subtle: mockSubtle,
      },
      writable: true,
      configurable: true,
    });
  } else {
    // If crypto exists, extend it with our mocks
    (globalThis.crypto as any).subtle = mockSubtle;
  }
} catch (error) {
  // Silently fail - this is expected in test environment
}

// Mock storage for tests
const storageData: Record<string, any> = {};

chrome.storage.local.get = vi.fn().mockImplementation((keys) => {
  if (typeof keys === 'string') {
    return Promise.resolve({ [keys]: storageData[keys] });
  }
  if (Array.isArray(keys)) {
    const result: Record<string, any> = {};
    keys.forEach(key => {
      if (key in storageData) {
        result[key] = storageData[key];
      }
    });
    return Promise.resolve(result);
  }
  if (keys === null || keys === undefined) {
    return Promise.resolve({ ...storageData });
  }
  return Promise.resolve({});
});

chrome.storage.local.set = vi.fn().mockImplementation((items) => {
  Object.assign(storageData, items);
  return Promise.resolve();
});

chrome.storage.local.clear = vi.fn().mockImplementation(() => {
  Object.keys(storageData).forEach(key => delete storageData[key]);
  return Promise.resolve();
});

// Helper to reset storage between tests
(globalThis as any).resetMockStorage = () => {
  Object.keys(storageData).forEach(key => delete storageData[key]);
};

// Helper to get storage data for assertions
(globalThis as any).getMockStorage = () => ({ ...storageData });
