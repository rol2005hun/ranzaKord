import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { hexToHsl, getContrastColor } from '~/utils/color';
import type { ThemeId, CustomPalette } from '../types/theme.types';
import type { ColorPalette } from '~/utils/colorExtraction';

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

  const cookieIsAdaptive = useCookie<boolean>('theme-adaptive', {
    default: () => false,
    maxAge: 31536000
  });

  const themeId = ref<ThemeId>(cookieThemeId.value);
  const customColors = ref<Record<string, string>>(cookieCustomColors.value || {});
  const isAdaptiveThemeEnabled = ref<boolean>(cookieIsAdaptive.value);
  const adaptivePalette = ref<ColorPalette | null>(null);

  const currentCustomPalette = computed<CustomPalette | null>(() => {
    if (isAdaptiveThemeEnabled.value && adaptivePalette.value) {
      return {
        primary: { hex: adaptivePalette.value.primary, ...hexToHsl(adaptivePalette.value.primary) },
        secondary: {
          hex: adaptivePalette.value.secondary,
          ...hexToHsl(adaptivePalette.value.secondary)
        }
      };
    }
    const hex = customColors.value[themeId.value] || DEFAULT_THEME_COLORS[themeId.value];
    if (hex) {
      const color = { hex, ...hexToHsl(hex) };
      return { primary: color, secondary: color };
    }
    return null;
  });

  watch(themeId, (val) => {
    cookieThemeId.value = val;
    if (import.meta.client && currentCustomPalette.value) {
      applyPaletteToDom(currentCustomPalette.value);
    }
  });

  watch(
    customColors,
    (val) => {
      cookieCustomColors.value = val;
    },
    { deep: true }
  );

  watch(isAdaptiveThemeEnabled, (val) => {
    cookieIsAdaptive.value = val;
    if (import.meta.client) {
      if (currentCustomPalette.value) {
        applyPaletteToDom(currentCustomPalette.value);
      }
      if (!val) {
        clearAdaptiveStyles();
      }
    }
  });

  watch(adaptivePalette, () => {
    if (isAdaptiveThemeEnabled.value && import.meta.client && currentCustomPalette.value) {
      applyPaletteToDom(currentCustomPalette.value);
    }
  });

  function applyThemeToDom(id: ThemeId) {
    document.documentElement.setAttribute('data-theme', id);
  }

  function applyPaletteToDom(palette: CustomPalette) {
    if (!import.meta.client) return;
    const el = document.documentElement;

    // Set primary color
    el.style.setProperty('--color-primary-h', String(palette.primary.h));
    el.style.setProperty('--color-primary-s', `${palette.primary.s}%`);
    el.style.setProperty('--color-primary-l', `${palette.primary.l}%`);
    el.style.setProperty('--color-primary-foreground', getContrastColor(palette.primary.hex));

    if (isAdaptiveThemeEnabled.value) {
      // Dynamic app-wide tinting based on primary color
      const h = palette.primary.h;
      // Backgrounds (deep dark)
      el.style.setProperty('--color-bg', `hsl(${h} 20% 4%)`);
      el.style.setProperty('--color-surface', `hsl(${h} 20% 8%)`);
      el.style.setProperty('--color-surface-hover', `hsl(${h} 20% 12%)`);
      el.style.setProperty('--color-surface-raised', `hsl(${h} 20% 16%)`);
      el.style.setProperty('--color-surface-glass', `hsl(${h} 20% 8% / 0.78)`);
      // Borders
      el.style.setProperty('--color-border', `hsl(${h} 20% 16%)`);
      el.style.setProperty('--color-border-hover', `hsl(${h} 20% 24%)`);
      // Texts
      el.style.setProperty('--color-text-primary', `hsl(${h} 10% 95%)`);
      el.style.setProperty('--color-text-secondary', `hsl(${h} 15% 75%)`);
      el.style.setProperty('--color-text-tertiary', `hsl(${h} 15% 55%)`);

      // Gradients using secondary color
      el.style.setProperty(
        '--gradient-hero',
        `linear-gradient(135deg, hsl(${palette.secondary.h} 30% 12%) 0%, hsl(${h} 20% 4%) 100%)`
      );
    } else {
      clearAdaptiveStyles();
    }
  }

  function clearAdaptiveStyles() {
    if (!import.meta.client) return;
    const el = document.documentElement;
    const vars = [
      '--color-bg',
      '--color-surface',
      '--color-surface-hover',
      '--color-surface-raised',
      '--color-surface-glass',
      '--color-border',
      '--color-border-hover',
      '--color-text-primary',
      '--color-text-secondary',
      '--color-text-tertiary',
      '--gradient-hero'
    ];
    vars.forEach((v) => el.style.removeProperty(v));
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
    if (import.meta.client && currentCustomPalette.value)
      applyPaletteToDom(currentCustomPalette.value);
  }

  function resetCustomColor() {
    const { [themeId.value]: _removed, ...rest } = customColors.value;
    customColors.value = rest;
    if (import.meta.client) {
      if (currentCustomPalette.value) {
        applyPaletteToDom(currentCustomPalette.value);
      } else {
        const el = document.documentElement;
        el.style.removeProperty('--color-primary-h');
        el.style.removeProperty('--color-primary-s');
        el.style.removeProperty('--color-primary-l');
        clearAdaptiveStyles();
      }
    }
  }

  function initialize() {
    if (!import.meta.client) return;
    applyThemeToDom(themeId.value);
    if (currentCustomPalette.value) applyPaletteToDom(currentCustomPalette.value);
  }

  return {
    themeId,
    customColors,
    currentCustomPalette,
    isAdaptiveThemeEnabled,
    adaptivePalette,
    DEFAULT_THEME_COLORS,
    setTheme,
    setCustomColor,
    resetCustomColor,
    initialize
  };
});
