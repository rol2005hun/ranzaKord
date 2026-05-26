import type { ThemeId, CustomColor } from '../types/theme.types';

export const useThemeStore = defineStore('theme', () => {
  const themeId = useCookie<ThemeId>('theme-id', { default: () => 'music', maxAge: 31536000 });
  const customColorHex = useCookie<string | null>('theme-custom-color', { default: () => null, maxAge: 31536000 });

  const customColor = computed<CustomColor | null>(() => {
    if (!customColorHex.value) return null;
    const hsl = hexToHsl(customColorHex.value);
    return { hex: customColorHex.value, ...hsl };
  });

  function setTheme(id: ThemeId) {
    themeId.value = id;
  }

  function setCustomColor(hex: string) {
    customColorHex.value = hex;
  }

  function resetCustomColor() {
    customColorHex.value = null;
  }

  function initialize() {
    // Handled by app.vue useHead and useCookie reactivity automatically.
  }

  return { themeId, customColor, setTheme, setCustomColor, resetCustomColor, initialize };
});
