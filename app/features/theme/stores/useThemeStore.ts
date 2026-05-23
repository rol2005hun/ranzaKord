import type { ThemeId, CustomColor } from '../types/theme.types';

export const useThemeStore = defineStore('theme', () => {
  const themeId = ref<ThemeId>('default');
  const customColor = ref<CustomColor | null>(null);

  function applyThemeToDom(id: ThemeId) {
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem('theme-id', id);
  }

  function applyColorToDom(color: CustomColor) {
    const el = document.documentElement;
    el.style.setProperty('--color-primary-h', String(color.h));
    el.style.setProperty('--color-primary-s', `${color.s}%`);
    el.style.setProperty('--color-primary-l', `${color.l}%`);
    localStorage.setItem('theme-custom-color', color.hex);
  }

  function setTheme(id: ThemeId) {
    themeId.value = id;
    if (import.meta.client) applyThemeToDom(id);
  }

  function setCustomColor(hex: string) {
    const hsl = hexToHsl(hex);
    const color: CustomColor = { hex, ...hsl };
    customColor.value = color;
    if (import.meta.client) applyColorToDom(color);
  }

  function resetCustomColor() {
    customColor.value = null;
    if (import.meta.client) {
      const el = document.documentElement;
      el.style.removeProperty('--color-primary-h');
      el.style.removeProperty('--color-primary-s');
      el.style.removeProperty('--color-primary-l');
      localStorage.removeItem('theme-custom-color');
    }
  }

  function initialize() {
    if (!import.meta.client) return;
    const savedId = localStorage.getItem('theme-id') as ThemeId | null;
    const savedHex = localStorage.getItem('theme-custom-color');
    if (savedId) setTheme(savedId);
    else applyThemeToDom(themeId.value);
    if (savedHex) setCustomColor(savedHex);
  }

  return { themeId, customColor, setTheme, setCustomColor, resetCustomColor, initialize };
});
