import { defineStore } from 'pinia';
import { ref } from 'vue';
import { hexToHsl, getContrastColor } from '~/utils/color';
import type { ThemeId, CustomColor } from '../types/theme.types';

export const useThemeStore = defineStore('theme', () => {
  const cookieThemeId = useCookie<ThemeId>('theme-id', {
    default: () => 'wc2026',
    maxAge: 31536000
  });
  const cookieCustomColor = useCookie<string | null>('theme-custom-color', {
    default: () => null,
    maxAge: 31536000
  });

  const themeId = ref<ThemeId>(cookieThemeId.value);
  const customColor = ref<CustomColor | null>(
    cookieCustomColor.value
      ? { hex: cookieCustomColor.value, ...hexToHsl(cookieCustomColor.value) }
      : null
  );

  watch(themeId, (val) => {
    cookieThemeId.value = val;
  });
  watch(customColor, (val) => {
    cookieCustomColor.value = val?.hex ?? null;
  });

  function applyThemeToDom(id: ThemeId) {
    document.documentElement.setAttribute('data-theme', id);
  }

  function applyColorToDom(color: CustomColor) {
    if (!import.meta.client) return;
    const el = document.documentElement;
    el.style.setProperty('--color-primary-h', String(color.h));
    el.style.setProperty('--color-primary-s', `${color.s}%`);
    el.style.setProperty('--color-primary-l', `${color.l}%`);
    el.style.setProperty('--color-primary-foreground', getContrastColor(color.hex));
  }

  function setTheme(id: ThemeId) {
    themeId.value = id;
    if (import.meta.client) {
      document.documentElement.classList.add('no-transition');
      applyThemeToDom(id);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('no-transition');
        });
      });
    }
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
    }
  }

  function initialize() {
    if (!import.meta.client) return;
    applyThemeToDom(themeId.value);
    if (customColor.value) applyColorToDom(customColor.value);
  }

  return { themeId, customColor, setTheme, setCustomColor, resetCustomColor, initialize };
});
