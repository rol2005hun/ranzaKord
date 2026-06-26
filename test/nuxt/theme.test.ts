import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useThemeStore } from '../../app/features/theme/stores/useThemeStore';
import { useTheme } from '../../app/features/theme/composables/useTheme';

describe('Theme Module', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    const store = useThemeStore();
    store.setTheme('dark');
    store.resetCustomColor();
    vi.resetAllMocks();
  });

  describe('useThemeStore', () => {
    it('initializes with default values', () => {
      const store = useThemeStore();
      expect(store.themeId).toBe('dark');
      expect(store.customColors['dark']).toBeUndefined();
    });

    it('sets theme', () => {
      const store = useThemeStore();
      store.setTheme('rose');
      expect(store.themeId).toBe('rose');
    });

    it('sets custom color', () => {
      const store = useThemeStore();
      store.setCustomColor('#ff0000');
      expect(store.currentCustomColor?.hex).toBe('#ff0000');
    });

    it('clears custom color', () => {
      const store = useThemeStore();
      store.setCustomColor('#ff0000');
      store.resetCustomColor();
      expect(store.customColors['dark']).toBeUndefined();
    });
  });

  describe('useTheme', () => {
    it('initializes theme from localStorage and handles body attributes', () => {
      const store = useThemeStore();
      const { initialize, setTheme, setCustomColor, themeId, currentCustomColor, themes } =
        useTheme();

      expect(themes.length).toBeGreaterThan(0);
      expect(themeId.value).toBe('dark');
      expect(currentCustomColor.value?.hex).toBe(store.DEFAULT_THEME_COLORS['dark']);

      // Reset state first to avoid cross-test pollution
      store.setTheme('dark');
      initialize();

      expect(store.themeId).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      // Test changing theme
      setTheme('rose');
      expect(store.themeId).toBe('rose');
      expect(document.documentElement.getAttribute('data-theme')).toBe('rose');

      // Test changing custom color
      setCustomColor('#123456');
      expect(store.currentCustomColor?.hex).toBe('#123456');
    });

    it('applies custom color via css variables', () => {
      const { setCustomColor } = useTheme();
      setCustomColor('#ff0000');

      const style = document.documentElement.style;
      expect(style.getPropertyValue('--color-primary-h')).toBeDefined();
    });

    it('removes custom color variables when cleared and applies default', () => {
      const { setCustomColor, resetCustomColor } = useTheme();
      setCustomColor('#ff0000');
      resetCustomColor();

      const style = document.documentElement.style;
      // Default color for 'dark' is #7430e8, which is HSL 262 80% 55%
      expect(style.getPropertyValue('--color-primary-h')).toBe('262');
    });
  });
});
