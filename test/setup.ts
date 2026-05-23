import { beforeAll } from 'vitest';

beforeAll(() => {
  if (typeof window !== 'undefined' && !window.localStorage) {
    const localStorageMock = {
      getItem: (key: string) => null,
      setItem: (key: string, value: string) => {},
      removeItem: (key: string) => {},
      clear: () => {}
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  }
});
