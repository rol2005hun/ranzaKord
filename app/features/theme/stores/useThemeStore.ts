import { defineStore } from 'pinia';
import { ref } from 'vue';
import { hexToHsl, getContrastColor } from '~/utils/color';
import type { ThemeId, CustomColor } from '../types/theme.types';

const DEFAULT_THEME_COLORS: Record<ThemeId, string> = {
  dark: '#7430e8',
  light: '#4b1dd9',
  ocean: '#0982ae',
  rose: '#cd143d',
  walker: '#ffcc00',
  wc2026: '#12d58d'
};

export const useThemeStore = defineStore('theme', () => {
  const cookieThemeId = useCookie<ThemeId>('theme-id', {
    default: () => 'wc2026',
    maxAge: 31536000
  });
  const cookieCustomColors = useCookie<Record<string, string>>('theme-custom-colors', {
    default: () => ({}),
    maxAge: 31536000
  });

  const themeId = ref<ThemeId>(cookieThemeId.value);
  const customColors = ref<Record<string, string>>(cookieCustomColors.value || {});

  const currentCustomColor = computed(() => {
    const hex = customColors.value[themeId.value] || DEFAULT_THEME_COLORS[themeId.value];
    return hex ? { hex, ...hexToHsl(hex) } : null;
  });

  watch(themeId, (val) => {
    cookieThemeId.value = val;
    // Reapply color when theme changes
    if (import.meta.client && currentCustomColor.value) {
      applyColorToDom(currentCustomColor.value);
    }
  });

  watch(
    customColors,
    (val) => {
      cookieCustomColors.value = val;
    },
    { deep: true }
  );

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
    customColors.value[themeId.value] = hex;
    if (import.meta.client && currentCustomColor.value) applyColorToDom(currentCustomColor.value);
  }

  function resetCustomColor() {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete customColors.value[themeId.value];
    if (import.meta.client) {
      // Re-apply the default color for this theme
      if (currentCustomColor.value) {
        applyColorToDom(currentCustomColor.value);
      } else {
        const el = document.documentElement;
        el.style.removeProperty('--color-primary-h');
        el.style.removeProperty('--color-primary-s');
        el.style.removeProperty('--color-primary-l');
      }
    }
  }

  function initialize() {
    if (!import.meta.client) return;
    applyThemeToDom(themeId.value);
    if (currentCustomColor.value) applyColorToDom(currentCustomColor.value);
  }

  return {
    themeId,
    customColors,
    currentCustomColor,
    DEFAULT_THEME_COLORS,
    setTheme,
    setCustomColor,
    resetCustomColor,
    initialize
  };
});
