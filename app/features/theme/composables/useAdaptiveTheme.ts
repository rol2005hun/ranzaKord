import { watch, onMounted } from 'vue';
import { usePlayerStore } from '@/features/player/stores/usePlayerStore';
import { useThemeStore } from '../stores/useThemeStore';
import { getPalette } from '@/utils/colorExtraction';

export function useAdaptiveTheme() {
  const playerStore = usePlayerStore();
  const themeStore = useThemeStore();

  async function updateAdaptiveColor() {
    if (!themeStore.isAdaptiveThemeEnabled) {
      themeStore.adaptivePalette = null;
      return;
    }

    const currentTrack = playerStore.currentTrack;
    if (!currentTrack || !currentTrack.thumbnailUrl) {
      themeStore.adaptivePalette = null;
      return;
    }

    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(currentTrack.thumbnailUrl)}&cb=${Date.now()}`;
      const palette = await getPalette(proxyUrl);

      if (palette) {
        themeStore.adaptivePalette = palette;
      } else {
        themeStore.adaptivePalette = null;
      }
    } catch (error) {
      console.warn('Failed to update adaptive color:', error);
      themeStore.adaptivePalette = null;
    }
  }

  onMounted(() => {
    updateAdaptiveColor();
  });

  watch(
    () => playerStore.currentTrack?.thumbnailUrl,
    () => {
      updateAdaptiveColor();
    }
  );

  watch(
    () => themeStore.isAdaptiveThemeEnabled,
    () => {
      updateAdaptiveColor();
    }
  );
}
