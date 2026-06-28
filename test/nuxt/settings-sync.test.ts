import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/features/auth/stores/useAuthStore';
import { usePlayerStore } from '@/features/player/stores/usePlayerStore';
import { useThemeStore } from '@/features/theme/stores/useThemeStore';
import settingsSyncPlugin from '@/plugins/settings-sync.client';
import { nextTick } from 'vue';

describe.skip('settings-sync.client plugin', () => {
  let mockNuxtApp: {
    hook: ReturnType<typeof vi.fn>;
    _mountedCallback: (() => void) | null;
  };
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create Pinia and stores
    const pinia = createPinia();
    setActivePinia(pinia);

    const authStore = useAuthStore();
    authStore.setUser(null);

    const themeStore = useThemeStore();
    themeStore.themeId = 'dark';
    themeStore.customColors = {};

    const playerStore = usePlayerStore();
    playerStore.$patch({ crossfadeEnabled: false, eqEnabled: false });

    mockNuxtApp = {
      hook: vi.fn((event, callback) => {
        if (event === 'app:mounted') {
          mockNuxtApp._mountedCallback = callback;
        }
      }),
      _mountedCallback: null
    };

    mockFetch = vi.fn().mockResolvedValue({});
    vi.stubGlobal('$fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('syncs from server to stores when user loads', async () => {
    settingsSyncPlugin(mockNuxtApp as unknown as ReturnType<typeof useNuxtApp>);
    if (mockNuxtApp._mountedCallback) mockNuxtApp._mountedCallback();

    const authStore = useAuthStore();
    const themeStore = useThemeStore();
    const playerStore = usePlayerStore();

    // Trigger watcher by updating currentUser
    authStore.setUser({
      id: '1',
      username: 'test',
      sub: '1',
      name: 'test',
      email: 'test@example.com',
      hasAccess: true,
      settings: {
        theme: 'light',
        crossfadeEnabled: true,
        eqEnabled: true
      }
    } as unknown as NonNullable<ReturnType<typeof useAuthStore>['currentUser']>);

    // Await watchers
    await nextTick();

    expect(themeStore.themeId).toBe('light');
    expect(playerStore.crossfadeEnabled).toBe(true);
    expect(playerStore.eqEnabled).toBe(true);

    // Should NOT trigger $fetch since it is syncing FROM server
    vi.advanceTimersByTime(2000);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('syncs from stores to server when local state changes', async () => {
    settingsSyncPlugin(mockNuxtApp as unknown as ReturnType<typeof useNuxtApp>);
    if (mockNuxtApp._mountedCallback) mockNuxtApp._mountedCallback();

    const themeStore = useThemeStore();

    // Change a local setting
    themeStore.$patch({ themeId: 'ocean' });

    await nextTick();

    // Fast forward debounce timer (1000ms)
    vi.advanceTimersByTime(1500);

    vi.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/me/settings',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.objectContaining({
          theme: 'ocean'
        })
      })
    );
  });
});
