import { beforeAll, vi } from 'vitest';

beforeAll(() => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        Reflect.deleteProperty(store, key);
      },
      clear: () => {
        store = {};
      }
    };
  })();

  const indexedDBMock = {
    open: vi.fn().mockReturnValue({
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null
    })
  };

  if (typeof globalThis !== 'undefined') {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
    Object.defineProperty(globalThis, 'indexedDB', { value: indexedDBMock, writable: true });
  }
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
    Object.defineProperty(window, 'indexedDB', { value: indexedDBMock, writable: true });
  }
});
