import type { ThemeId } from '../features/theme/types/theme.types';
import type { CrossfadeType } from '../features/player/types/player.types';

export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();
  const themeStore = useThemeStore();
  let isSyncingFromServer = false;

  nuxtApp.hook('app:mounted', () => {
    // When user changes, sync settings from server to stores
    watch(
      () => authStore.currentUser,
      (user) => {
        if (user && user.settings) {
          isSyncingFromServer = true;
          const s = user.settings;

          if (s.theme !== undefined) themeStore.setTheme(s.theme as ThemeId);
          if (s.customColors !== undefined)
            themeStore.customColors = s.customColors as Record<string, string>;
          // Keep backward compatibility if old users only have customColor
          else if (s.customColor !== undefined && s.theme) {
            themeStore.customColors[s.theme] = s.customColor;
          }

          if (s.isAdaptiveThemeEnabled !== undefined) {
            themeStore.isAdaptiveThemeEnabled = s.isAdaptiveThemeEnabled;
          }

          if (s.crossfadeEnabled !== undefined) playerStore.crossfadeEnabled = s.crossfadeEnabled;
          if (s.crossfadeDuration !== undefined)
            playerStore.crossfadeDuration = s.crossfadeDuration;
          if (s.crossfadeType !== undefined)
            playerStore.crossfadeType = s.crossfadeType as CrossfadeType;
          if (s.isKaraoke !== undefined) playerStore.isKaraoke = s.isKaraoke;
          if (s.isAudioReactiveLyrics !== undefined)
            playerStore.isAudioReactiveLyrics = s.isAudioReactiveLyrics;
          if (s.playbackOrder !== undefined)
            playerStore.playbackOrder = s.playbackOrder as 'sequential' | 'random' | 'reverse';
          if (s.eqEnabled !== undefined) playerStore.eqEnabled = s.eqEnabled;
          if (s.eqPreset !== undefined) playerStore.eqPreset = s.eqPreset;
          if (s.eqBands !== undefined) playerStore.eqBands = s.eqBands;

          nextTick(() => {
            isSyncingFromServer = false;
          });
        }
      },
      { immediate: true, deep: true }
    );

    // Sync from stores to server
    const syncToServer = useDebounceFn(async () => {
      if (!authStore.isAuthenticated || isSyncingFromServer) return;

      const settings = {
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
        playbackOrder: playerStore.playbackOrder
      };

      try {
        await $fetch('/api/me/settings', {
          method: 'PATCH',
          body: settings
        });
      } catch (err) {
        console.error('Failed to sync settings', err);
      }
    }, 1000);

    // Watch stores
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
        playerStore.playbackOrder
      ],
      () => {
        if (!isSyncingFromServer) {
          syncToServer();
        }
      },
      { deep: true }
    );
  });
});
