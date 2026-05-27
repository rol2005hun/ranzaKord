import type { ThemeId, ThemeOption } from '../types/theme.types';

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'dark', label: 'Dark', icon: 'ph:moon-fill', dark: true },
  { id: 'light', label: 'Light', icon: 'ph:sun-fill', dark: false },
  { id: 'ocean', label: 'Ocean', icon: 'ph:waves-fill', dark: false },
  { id: 'rose', label: 'Rose', icon: 'ph:flower-lotus-fill', dark: false }
];

export function useTheme() {
  const store = useThemeStore();

  function setThemeWithTransition(id: ThemeId) {
    if (import.meta.client) {
      document.documentElement.classList.add('theme-transitioning');
      store.setTheme(id);
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 50);
    } else {
      store.setTheme(id);
    }
  }

  return {
    themeId: computed(() => store.themeId),
    customColor: computed(() => store.customColor),
    themes: THEME_OPTIONS,
    setTheme: setThemeWithTransition,
    setCustomColor: (hex: string) => store.setCustomColor(hex),
    resetCustomColor: () => store.resetCustomColor(),
    initialize: () => store.initialize()
  };
}
