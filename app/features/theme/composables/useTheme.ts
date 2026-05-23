import type { ThemeId, ThemeOption } from '../types/theme.types';

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'default', label: 'Default' },
  { id: 'dark', label: 'Dark' },
  { id: 'ocean', label: 'Ocean' }
];

export function useTheme() {
  const store = useThemeStore();

  return {
    themeId: computed(() => store.themeId),
    customColor: computed(() => store.customColor),
    themes: THEME_OPTIONS,
    setTheme: (id: ThemeId) => store.setTheme(id),
    setCustomColor: (hex: string) => store.setCustomColor(hex),
    resetCustomColor: () => store.resetCustomColor(),
    initialize: () => store.initialize()
  };
}
