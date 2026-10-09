import { watch, onMounted } from 'vue';
import { usePlayerStore } from '@/features/player/stores/usePlayerStore';
import { useThemeStore } from '../stores/useThemeStore';
import { getPalette, type ColorPalette } from '@/utils/colorExtraction';

const paletteCache = new Map<string, ColorPalette>();

// Hydrate from localStorage
if (import.meta.client) {
  try {
    const saved = localStorage.getItem('theme_paletteCache');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.entries(parsed).forEach(([k, v]) => {
        paletteCache.set(k, v as ColorPalette);
      });
    }
  } catch {
    void 0;
  }
}

function savePaletteCache() {
  if (import.meta.client) {
    try {
      localStorage.setItem('theme_paletteCache', JSON.stringify(Object.fromEntries(paletteCache)));
    } catch {
      void 0;
    }
  }
}

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
      // Don't set to null immediately if we are just pausing/loading?
      // Wait, if no track, then no theme.
      themeStore.adaptivePalette = null;
      return;
    }

    try {
      if (paletteCache.has(currentTrack.thumbnailUrl)) {
        themeStore.adaptivePalette = paletteCache.get(currentTrack.thumbnailUrl) || null;
        return;
      }

      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(currentTrack.thumbnailUrl)}`;
      const palette = await getPalette(proxyUrl);

      if (palette) {
        paletteCache.set(currentTrack.thumbnailUrl, palette);
        savePaletteCache();
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
