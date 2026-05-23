import { beforeAll } from 'vitest';

beforeAll(() => {
  if (typeof window !== 'undefined' && !window.localStorage) {
    const localStorageMock = {
      getItem: (_key: string) => null,
      setItem: (_key: string, _value: string) => {},
      removeItem: (_key: string) => {},
      clear: () => {}
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  }
});
