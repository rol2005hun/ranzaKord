import { beforeAll } from 'vitest';

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

  if (typeof globalThis !== 'undefined') {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
  }
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  }
});
