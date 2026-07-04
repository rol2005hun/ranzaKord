import { watch, onMounted } from 'vue';
import { usePlayerStore } from '@/features/player/stores/usePlayerStore';
import { useThemeStore } from '../stores/useThemeStore';
import { getDominantColor } from '@/utils/colorExtraction';

export function useAdaptiveTheme() {
  const playerStore = usePlayerStore();
  const themeStore = useThemeStore();

  async function updateAdaptiveColor() {
    if (!themeStore.isAdaptiveThemeEnabled) {
      themeStore.adaptiveColorHex = null;
      return;
    }

    const currentTrack = playerStore.currentTrack;
    if (!currentTrack || !currentTrack.thumbnailUrl) {
      themeStore.adaptiveColorHex = null;
      return;
    }

    try {
      const isGoogleImage = currentTrack.thumbnailUrl.includes('googleusercontent.com');
      const proxyUrl = isGoogleImage
        ? currentTrack.thumbnailUrl
        : `/api/proxy-image?url=${encodeURIComponent(currentTrack.thumbnailUrl)}&cb=${Date.now()}`;
      const color = await getDominantColor(proxyUrl);

      if (color) {
        themeStore.adaptiveColorHex = color;
      } else {
        themeStore.adaptiveColorHex = null;
      }
    } catch (error) {
      console.warn('Failed to update adaptive color:', error);
      themeStore.adaptiveColorHex = null;
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
