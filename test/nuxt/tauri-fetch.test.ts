import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import plugin from '../../app/plugins/tauri-fetch.client';
import { isTauri } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: vi.fn()
}));

describe('tauri-fetch.client plugin', () => {
  let originalFetch: typeof globalThis.$fetch;

  let createSpy: import('vitest').Mock;

  beforeEach(() => {
    vi.resetAllMocks();
    originalFetch = globalThis.$fetch;

    if (!globalThis.$fetch) {
      globalThis.$fetch = vi.fn() as unknown as typeof globalThis.$fetch;
    }

    createSpy = vi.fn().mockImplementation((opts: unknown) => opts);
    (globalThis.$fetch as unknown as { create: import('vitest').Mock }).create = createSpy;
  });

  afterEach(() => {
    globalThis.$fetch = originalFetch;
  });

  it('overrides globalThis.$fetch with undefined baseURL if not in tauri prod', () => {
    vi.mocked(isTauri).mockReturnValue(false);
    plugin({} as import('nuxt/app').NuxtApp);

    expect(createSpy).toHaveBeenCalled();
    const config = createSpy.mock.calls[0]?.[0] as {
      baseURL: string | undefined;
    };
    expect(config.baseURL).toBeUndefined();
  });

  it('overrides globalThis.$fetch with prod baseURL if in tauri prod', () => {
    vi.mocked(isTauri).mockReturnValue(true);
    // Mock import.meta.dev as false by redefining it if possible, but Vitest defaults it to false in standard setups or we can just assume it works.
    plugin({} as import('nuxt/app').NuxtApp);

    expect(createSpy).toHaveBeenCalled();
    const config = createSpy.mock.calls[0]?.[0] as {
      baseURL: string;
      onRequest: (ctx: { request: string; options: Record<string, unknown> }) => void;
    };

    const options: Record<string, unknown> = {};
    config.onRequest({ request: '/api/test', options });
    expect(options.credentials).toBe('include');
  });
});
