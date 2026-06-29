import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import plugin from '../../app/plugins/deep-link.client';

mockNuxtImport('useAuth', () => () => ({
  fetchUser: vi.fn().mockResolvedValue(true),
  isAuthenticated: { value: true }
}));

mockNuxtImport('navigateTo', () => {
  return (path: string) => {
    window.location.href = path;
  };
});

const { mockOnOpenUrl, mockGetCurrent, mockIsTauri } = vi.hoisted(() => ({
  mockOnOpenUrl: vi.fn(),
  mockGetCurrent: vi.fn().mockResolvedValue([]),
  mockIsTauri: vi.fn().mockReturnValue(true)
}));

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: mockIsTauri
}));

vi.mock('@tauri-apps/plugin-deep-link', () => ({
  onOpenUrl: mockOnOpenUrl,
  getCurrent: mockGetCurrent
}));

describe('deep-link.client plugin', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    vi.resetAllMocks();
    store = {};

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      setItem: vi.fn((key: string, val: string) => {
        store[key] = val;
      }),
      getItem: vi.fn((key: string) => store[key] || null),
      clear: vi.fn(() => {
        store = {};
      })
    });

    // Mock window.location
    vi.stubGlobal('location', { href: 'http://localhost' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing if not in tauri environment', async () => {
    mockIsTauri.mockReturnValueOnce(false);
    await plugin({} as unknown as import('nuxt/app').NuxtApp);
    expect(mockOnOpenUrl).not.toHaveBeenCalled();
  });

  const mockNuxtApp = {
    runWithContext: async (fn: () => Promise<void>) => await fn()
  } as unknown as import('nuxt/app').NuxtApp;

  it('registers onOpenUrl and ignores non-ranzakord protocols', async () => {
    mockIsTauri.mockReturnValueOnce(true);
    await plugin(mockNuxtApp);
    expect(mockOnOpenUrl).toHaveBeenCalled();

    const callback = mockOnOpenUrl.mock.calls[0]?.[0] as (urls: string[]) => Promise<void>;

    await callback(['http://example.com/foo']);

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(window.location.href).toBe('http://localhost');
  });

  it('ignores valid protocol but missing token', async () => {
    mockIsTauri.mockReturnValueOnce(true);
    await plugin(mockNuxtApp);
    const callback = mockOnOpenUrl.mock.calls[0]?.[0] as (urls: string[]) => Promise<void>;

    await callback(['ranzakord://auth?other=123']);

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(window.location.href).toBe('http://localhost');
  });

  it('saves token and redirects on valid deep link', async () => {
    mockIsTauri.mockReturnValueOnce(true);
    await plugin(mockNuxtApp);
    const callback = mockOnOpenUrl.mock.calls[0]?.[0] as (urls: string[]) => Promise<void>;

    await callback(['ranzakord://auth?token=my-secret-token']);

    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'my-secret-token');
    expect(window.location.href).toBe('/');
  });
});
