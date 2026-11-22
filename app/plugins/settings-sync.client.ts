import type { ThemeId } from '../features/theme/types/theme.types';
import type { CrossfadeType } from '../features/player/types/player.types';

export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();
  const themeStore = useThemeStore();
  const { isOffline } = useNetworkStatus();
  let isSyncingFromServer = false;

  function applySettings(s: Record<string, unknown>): void {
    if (s.theme !== undefined && themeStore.themeId !== s.theme) {
      themeStore.setTheme(s.theme as ThemeId);
    }
    if (s.customColors !== undefined) {
      themeStore.customColors = s.customColors as Record<string, string>;
    } else if (s.customColor !== undefined && s.theme) {
      themeStore.customColors[s.theme as string] = s.customColor as string;
    }

    if (
      s.isAdaptiveThemeEnabled !== undefined &&
      themeStore.isAdaptiveThemeEnabled !== s.isAdaptiveThemeEnabled
    ) {
      themeStore.isAdaptiveThemeEnabled = s.isAdaptiveThemeEnabled as boolean;
    }

    if (s.crossfadeEnabled !== undefined)
      playerStore.crossfadeEnabled = s.crossfadeEnabled as boolean;
    if (s.crossfadeDuration !== undefined)
      playerStore.crossfadeDuration = s.crossfadeDuration as number;
    if (s.crossfadeType !== undefined) playerStore.crossfadeType = s.crossfadeType as CrossfadeType;
    if (s.isKaraoke !== undefined) playerStore.isKaraoke = s.isKaraoke as boolean;
    if (s.isAudioReactiveLyrics !== undefined)
      playerStore.isAudioReactiveLyrics = s.isAudioReactiveLyrics as boolean;
    if (s.playbackOrder !== undefined)
      playerStore.playbackOrder = s.playbackOrder as 'sequential' | 'random' | 'reverse';
    if (s.eqEnabled !== undefined) playerStore.eqEnabled = s.eqEnabled as boolean;
    if (s.eqPreset !== undefined) playerStore.eqPreset = s.eqPreset as string;
    if (s.eqBands !== undefined) playerStore.eqBands = s.eqBands as number[];
    if (s.isSlowedReverb !== undefined) playerStore.isSlowedReverb = s.isSlowedReverb as boolean;
    if (s.isNightcore !== undefined) playerStore.isNightcore = s.isNightcore as boolean;
    if (s.reverbPreset !== undefined)
      playerStore.reverbPreset = s.reverbPreset as
        'none' | 'room' | 'hall' | 'cathedral' | 'shower' | 'muffled';
    if (s.isSpatialAudio !== undefined) playerStore.isSpatialAudio = s.isSpatialAudio as boolean;
    if (s.isStereoWidener !== undefined) playerStore.isStereoWidener = s.isStereoWidener as boolean;
    if (s.bassBoostEnabled !== undefined)
      playerStore.bassBoostEnabled = s.bassBoostEnabled as boolean;
    if (s.playbackSpeed !== undefined) playerStore.playbackSpeed = s.playbackSpeed as number;
    if (s.preservesPitch !== undefined) playerStore.preservesPitch = s.preservesPitch as boolean;
    if (s.sponsorBlockEnabled !== undefined)
      playerStore.sponsorBlockEnabled = s.sponsorBlockEnabled as boolean;
    if (s.globalShortcutsEnabled !== undefined)
      playerStore.globalShortcutsEnabled = s.globalShortcutsEnabled as boolean;
  }

  function getCurrentSettings(): Record<string, unknown> {
    return {
      theme: themeStore.themeId,
      customColors: themeStore.customColors,
      isAdaptiveThemeEnabled: themeStore.isAdaptiveThemeEnabled,
      crossfadeEnabled: playerStore.crossfadeEnabled,
      crossfadeDuration: playerStore.crossfadeDuration,
      crossfadeType: playerStore.crossfadeType,
      isKaraoke: playerStore.isKaraoke,
      isAudioReactiveLyrics: playerStore.isAudioReactiveLyrics,
      eqEnabled: playerStore.eqEnabled,
      eqPreset: playerStore.eqPreset,
      eqBands: playerStore.eqBands,
      playbackOrder: playerStore.playbackOrder,
      isSlowedReverb: playerStore.isSlowedReverb,
      isNightcore: playerStore.isNightcore,
      reverbPreset: playerStore.reverbPreset,
      isSpatialAudio: playerStore.isSpatialAudio,
      isStereoWidener: playerStore.isStereoWidener,
      bassBoostEnabled: playerStore.bassBoostEnabled,
      playbackSpeed: playerStore.playbackSpeed,
      preservesPitch: playerStore.preservesPitch,
      sponsorBlockEnabled: playerStore.sponsorBlockEnabled,
      globalShortcutsEnabled: playerStore.globalShortcutsEnabled
    };
  }

  async function flushPendingSync(): Promise<void> {
    if (!authStore.isAuthenticated || isOffline.value) return;
    const rawPending = localStorage.getItem('ranzakord_pending_settings_sync');
    if (!rawPending) return;

    try {
      const payload = JSON.parse(rawPending) as Record<string, unknown>;
      await $fetch(useApiUrl('/api/me/settings'), {
        method: 'PATCH',
        body: payload
      });
      localStorage.removeItem('ranzakord_pending_settings_sync');
    } catch {
      void 0;
    }
  }

  nuxtApp.hook('app:mounted', () => {
    try {
      const savedLocal = localStorage.getItem('ranzakord_local_settings');
      if (savedLocal) {
        const parsed = JSON.parse(savedLocal) as Record<string, unknown>;
        isSyncingFromServer = true;
        applySettings(parsed);
        nextTick(() => {
          isSyncingFromServer = false;
        });
      }
    } catch {
      void 0;
    }

    watch(
      () => authStore.currentUser,
      (user) => {
        if (user && user.settings) {
          isSyncingFromServer = true;
          applySettings(user.settings as Record<string, unknown>);
          try {
            localStorage.setItem('ranzakord_local_settings', JSON.stringify(getCurrentSettings()));
          } catch {
            void 0;
          }
          nextTick(() => {
            isSyncingFromServer = false;
          });
        }
      },
      { immediate: true, deep: true }
    );

    const syncToServer = useDebounceFn(async () => {
      if (isSyncingFromServer) return;
      const settings = getCurrentSettings();

      try {
        localStorage.setItem('ranzakord_local_settings', JSON.stringify(settings));
      } catch {
        void 0;
      }

      if (!authStore.isAuthenticated || isOffline.value) {
        if (authStore.isAuthenticated) {
          try {
            localStorage.setItem('ranzakord_pending_settings_sync', JSON.stringify(settings));
          } catch {
            void 0;
          }
        }
        return;
      }

      try {
        await $fetch(useApiUrl('/api/me/settings'), {
          method: 'PATCH',
          body: settings
        });
        localStorage.removeItem('ranzakord_pending_settings_sync');
      } catch {
        try {
          localStorage.setItem('ranzakord_pending_settings_sync', JSON.stringify(settings));
        } catch {
          void 0;
        }
      }
    }, 1000);

    watch(
      () => [
        themeStore.themeId,
        themeStore.customColors,
        themeStore.isAdaptiveThemeEnabled,
        playerStore.crossfadeEnabled,
        playerStore.crossfadeDuration,
        playerStore.crossfadeType,
        playerStore.isKaraoke,
        playerStore.isAudioReactiveLyrics,
        playerStore.eqEnabled,
        playerStore.eqPreset,
        playerStore.eqBands,
        playerStore.playbackOrder,
        playerStore.isSlowedReverb,
        playerStore.isNightcore,
        playerStore.reverbPreset,
        playerStore.isSpatialAudio,
        playerStore.isStereoWidener,
        playerStore.bassBoostEnabled,
        playerStore.playbackSpeed,
        playerStore.preservesPitch,
        playerStore.sponsorBlockEnabled,
        playerStore.globalShortcutsEnabled
      ],
      () => {
        if (!isSyncingFromServer) {
          syncToServer();
        }
      },
      { deep: true }
    );

    watch(
      isOffline,
      (offline) => {
        if (!offline) {
          flushPendingSync();
        }
      },
      { immediate: true }
    );
  });
});
