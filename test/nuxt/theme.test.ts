import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useThemeStore } from '@/features/theme/stores/useThemeStore';
import { useTheme } from '@/features/theme/composables/useTheme';

describe('Theme Feature', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    // Reset cookies
    const themeCookie = useCookie('theme-id');
    themeCookie.value = 'music';
    const colorCookie = useCookie('theme-custom-color');
    colorCookie.value = null;
  });

  describe('useThemeStore', () => {
    it('initializes with default theme', () => {
      const store = useThemeStore();
      expect(store.themeId).toBe('music');
      expect(store.customColor).toBeNull();
    });

    it('sets theme', () => {
      const store = useThemeStore();
      store.setTheme('dark');
      expect(store.themeId).toBe('dark');
    });

    it('sets custom color', () => {
      const store = useThemeStore();
      store.setCustomColor('#ff0000');
      expect(store.customColor?.hex).toBe('#ff0000');
      expect(store.customColor?.h).toBe(0);
      expect(store.customColor?.s).toBe(100);
      expect(store.customColor?.l).toBe(50);
    });

    it('resets custom color', () => {
      const store = useThemeStore();
      store.setCustomColor('#ff0000');
      store.resetCustomColor();
      expect(store.customColor).toBeNull();
    });
  });

  describe('useTheme', () => {
    it('exposes store methods and state', () => {
      const { themeId, customColor, themes, setTheme, setCustomColor, resetCustomColor } =
        useTheme();
      expect(themeId.value).toBe('music');
      expect(customColor.value).toBeNull();
      expect(themes.length).toBe(4);

      setTheme('dark');
      expect(themeId.value).toBe('dark');

      setCustomColor('#ff0000');
      expect(customColor.value?.hex).toBe('#ff0000');

      resetCustomColor();
      expect(customColor.value).toBeNull();
    });
  });
});
