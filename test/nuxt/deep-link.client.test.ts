import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import plugin from '../../app/plugins/deep-link.client';

const { mockOnOpenUrl } = vi.hoisted(() => ({
  mockOnOpenUrl: vi.fn()
}));

vi.mock('@tauri-apps/plugin-deep-link', () => ({
  onOpenUrl: mockOnOpenUrl
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
    await plugin({} as unknown as import('nuxt/app').NuxtApp);
    expect(mockOnOpenUrl).not.toHaveBeenCalled();
  });

  it('registers onOpenUrl and ignores non-ranzakord protocols', async () => {
    vi.stubGlobal('__TAURI_INTERNALS__', true);
    await plugin({} as unknown as import('nuxt/app').NuxtApp);
    expect(mockOnOpenUrl).toHaveBeenCalled();

    const callback = mockOnOpenUrl.mock.calls[0]![0] as (urls: string[]) => void;

    callback(['http://example.com/foo']);

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(window.location.href).toBe('http://localhost');
  });

  it('ignores valid protocol but missing token', async () => {
    vi.stubGlobal('__TAURI_INTERNALS__', true);
    await plugin({} as unknown as import('nuxt/app').NuxtApp);
    const callback = mockOnOpenUrl.mock.calls[0]![0] as (urls: string[]) => void;

    callback(['ranzakord://auth?other=123']);

    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(window.location.href).toBe('http://localhost');
  });

  it('saves token and redirects on valid deep link', async () => {
    vi.stubGlobal('__TAURI_INTERNALS__', true);
    await plugin({} as unknown as import('nuxt/app').NuxtApp);
    const callback = mockOnOpenUrl.mock.calls[0]![0] as (urls: string[]) => void;

    callback(['ranzakord://auth?token=my-secret-token']);

    expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'my-secret-token');
    expect(window.location.href).toBe('/');
  });
});
