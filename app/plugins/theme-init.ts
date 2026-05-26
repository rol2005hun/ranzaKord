import type { ThemeId } from '@/features/theme/types/theme.types';

export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore();
  const themeCookie = useCookie<ThemeId>('theme-id', {
    default: () => 'default',
    maxAge: 60 * 60 * 24 * 365
  });
  const customColorCookie = useCookie<string | null>('theme-custom-color', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 365
  });

  if (themeCookie.value) {
    themeStore.setTheme(themeCookie.value);
  }

  if (customColorCookie.value) {
    themeStore.setCustomColor(customColorCookie.value);
  }

  useHead({
    htmlAttrs: {
      'data-theme': themeStore.themeId
    }
  });
});
