import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import plugin from '../../app/plugins/tauri-fetch.client';
import { isTauri } from '@tauri-apps/api/core';

import { mockNuxtImport } from '@nuxt/test-utils/runtime';

vi.mock('@tauri-apps/api/core', () => ({
  isTauri: vi.fn()
}));

const createSpy = vi.hoisted(() => vi.fn().mockImplementation((opts: unknown) => opts));
mockNuxtImport('$fetch', () => ({
  create: createSpy
}));

describe('tauri-fetch.client plugin', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.TEST_TAURI_FETCH = '1';
    createSpy.mockClear();
  });

  afterEach(() => {
    delete process.env.TEST_TAURI_FETCH;
  });

  it('overrides globalThis.$fetch with undefined baseURL if not in tauri prod', () => {
    vi.mocked(isTauri).mockReturnValue(false);
    if (typeof plugin === 'function') {
      (plugin as unknown as (app: import('nuxt/app').NuxtApp) => void)(
        {} as import('nuxt/app').NuxtApp
      );
    } else {
      (plugin as unknown as { setup?: (app: import('nuxt/app').NuxtApp) => void }).setup?.(
        {} as import('nuxt/app').NuxtApp
      );
    }

    expect(createSpy).toHaveBeenCalled();
    const config = createSpy.mock.calls[0]?.[0] as {
      baseURL: string | undefined;
    };
    expect(config.baseURL).toBeUndefined();
  });

  it('overrides globalThis.$fetch with prod baseURL if in tauri prod', () => {
    vi.mocked(isTauri).mockReturnValue(true);
    if (typeof plugin === 'function') {
      (plugin as unknown as (app: import('nuxt/app').NuxtApp) => void)(
        {} as import('nuxt/app').NuxtApp
      );
    } else {
      (plugin as unknown as { setup?: (app: import('nuxt/app').NuxtApp) => void }).setup?.(
        {} as import('nuxt/app').NuxtApp
      );
    }

    expect(createSpy).toHaveBeenCalled();
    const config = createSpy.mock.calls[0]?.[0] as {
      baseURL: string;
      onRequest: (ctx: { request: string; options: Record<string, unknown> }) => void;
    };

    const options: Record<string, unknown> = {};
    config.onRequest({ request: '/api/test', options });
    expect(options.credentials).toBe('omit');
  });
});
