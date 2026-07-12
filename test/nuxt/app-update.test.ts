import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppUpdate } from '../../app/features/core/composables/useAppUpdate';
import { useUpdaterStore } from '../../app/features/updater/stores/useUpdaterStore';
import { check } from '@tauri-apps/plugin-updater';

import { useRuntimeConfig } from '#imports';

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn()
}));

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: vi.fn()
}));

describe('useAppUpdate', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalFetch: typeof globalThis.$fetch;

  beforeEach(() => {
    setActivePinia(createPinia());
    useRuntimeConfig().public.appVersion = '0.1.0';
    vi.clearAllMocks();

    originalFetch = globalThis.$fetch;
    fetchMock = vi.fn();
    globalThis.$fetch = fetchMock as unknown as typeof globalThis.$fetch;

    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    vi.mocked(check).mockRejectedValue(new Error('no native updater'));

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true
    });
  });

  afterEach(() => {
    globalThis.$fetch = originalFetch;
    vi.restoreAllMocks();
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  });

  describe('checkViaGithub', () => {
    it('sets update when newer version is found', async () => {
      fetchMock.mockResolvedValue([
        {
          tag_name: 'v0.2.0',
          name: 'Release 0.2.0',
          body: 'Changelog',
          published_at: '2024-01-01T00:00:00Z',
          assets: [{ name: 'app.exe', browser_download_url: 'http://test.exe', size: 1000 }]
        },
        {
          tag_name: 'v0.1.0',
          assets: []
        }
      ]);

      const { checkForUpdates } = useAppUpdate();
      await checkForUpdates();

      const store = useUpdaterStore();
      expect(store.info.available).toBe(true);
      expect(store.info.version).toBe('0.2.0');
      expect(store.info.externalDownloadUrl).toBe('http://test.exe');
      expect(store.info.isMandatory).toBe(true);
    });

    it('does not set update when no newer version', async () => {
      fetchMock.mockResolvedValue([
        {
          tag_name: 'v0.1.0',
          assets: []
        }
      ]);

      const { checkForUpdates } = useAppUpdate();
      await checkForUpdates();

      const store = useUpdaterStore();
      expect(store.info.available).toBe(false);
    });

    it('handles android APK updates', async () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Android',
        configurable: true
      });

      fetchMock.mockResolvedValue([
        {
          tag_name: 'v0.1.1',
          name: 'Release 0.1.1',
          assets: [{ name: 'app.apk', browser_download_url: 'http://test.apk', size: 2000 }]
        }
      ]);

      const { checkForUpdates } = useAppUpdate();
      await checkForUpdates();

      const store = useUpdaterStore();
      expect(store.info.available).toBe(true);
      expect(store.info.version).toBe('0.1.1');
      expect(store.info.externalDownloadUrl).toBe('http://test.apk');
      expect(store.info.isMandatory).toBe(false);
    });

    it('ignores versions without proper assets', async () => {
      fetchMock.mockResolvedValue([
        {
          tag_name: 'v0.2.0',
          assets: [{ name: 'source.zip', size: 100 }]
        }
      ]);

      const { checkForUpdates } = useAppUpdate();
      await checkForUpdates();

      const store = useUpdaterStore();
      expect(store.info.available).toBe(false);
    });

    it('does not crash when no releases found', async () => {
      fetchMock.mockResolvedValue([]);

      const { checkForUpdates } = useAppUpdate();
      await checkForUpdates();

      const store = useUpdaterStore();
      expect(store.info.available).toBe(false);
    });
  });
});
