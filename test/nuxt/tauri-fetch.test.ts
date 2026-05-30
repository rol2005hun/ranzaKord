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

  it('does nothing if not in tauri', () => {
    vi.mocked(isTauri).mockReturnValue(false);
    plugin({} as import('nuxt/app').NuxtApp);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('overrides globalThis.$fetch if in tauri', () => {
    vi.mocked(isTauri).mockReturnValue(true);
    plugin({} as import('nuxt/app').NuxtApp);

    expect(createSpy).toHaveBeenCalled();
    const config = createSpy.mock.calls[0]?.[0] as {
      baseURL: string;
      onRequest: (ctx: { options: Record<string, unknown> }) => void;
    };
    expect(config.baseURL).toBe('https://kord.ranzak.dev');

    const options: Record<string, unknown> = {};
    config.onRequest({ options });
    expect(options.credentials).toBe('include');
  });
});
