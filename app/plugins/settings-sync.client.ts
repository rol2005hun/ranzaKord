import type { ThemeId } from '../features/theme/types/theme.types';
import type { CrossfadeType } from '../features/player/types/player.types';

export default defineNuxtPlugin((nuxtApp) => {
  const authStore = useAuthStore();
  const playerStore = usePlayerStore();
  const themeStore = useThemeStore();
  let isSyncingFromServer = false;

  nuxtApp.hook('app:mounted', () => {
    watch(
      () => authStore.currentUser,
      (user) => {
        if (user && user.settings) {
          isSyncingFromServer = true;
          const s = user.settings;

          if (s.theme !== undefined && themeStore.themeId !== s.theme) {
            themeStore.setTheme(s.theme as ThemeId);
          }
          if (s.customColors !== undefined) {
            themeStore.customColors = s.customColors as Record<string, string>;
          } else if (s.customColor !== undefined && s.theme) {
            themeStore.customColors[s.theme] = s.customColor;
          }

          if (
            s.isAdaptiveThemeEnabled !== undefined &&
            themeStore.isAdaptiveThemeEnabled !== s.isAdaptiveThemeEnabled
          ) {
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
          if (s.isSlowedReverb !== undefined) playerStore.isSlowedReverb = s.isSlowedReverb;
          if (s.isNightcore !== undefined) playerStore.isNightcore = s.isNightcore;
          if (s.reverbPreset !== undefined) playerStore.reverbPreset = s.reverbPreset;
          if (s.isSpatialAudio !== undefined) playerStore.isSpatialAudio = s.isSpatialAudio;
          if (s.isStereoWidener !== undefined) playerStore.isStereoWidener = s.isStereoWidener;
          if (s.bassBoostEnabled !== undefined) playerStore.bassBoostEnabled = s.bassBoostEnabled;
          if (s.playbackSpeed !== undefined) playerStore.playbackSpeed = s.playbackSpeed;
          if (s.preservesPitch !== undefined) playerStore.preservesPitch = s.preservesPitch;
          if (s.sponsorBlockEnabled !== undefined)
            playerStore.sponsorBlockEnabled = s.sponsorBlockEnabled;
          if (s.globalShortcutsEnabled !== undefined)
            playerStore.globalShortcutsEnabled = s.globalShortcutsEnabled;

          nextTick(() => {
            isSyncingFromServer = false;
          });
        }
      },
      { immediate: true, deep: true }
    );

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

      try {
        await $fetch(useApiUrl('/api/me/settings'), {
          method: 'PATCH',
          body: settings
        });
      } catch (err) {
        console.error('Failed to sync settings', err);
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
  });
});
