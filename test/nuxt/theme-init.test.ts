import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import type { Ref } from 'vue';

import { useThemeStore } from '@/features/theme/stores/useThemeStore';
import themeInitPlugin from '@/plugins/theme-init';

const hoisted = vi.hoisted(() => ({
  themeCookie: { value: 'dark' as 'default' | 'dark' | 'ocean' },
  customColorCookie: { value: '#336699' as string | null },
  useHeadSpy: vi.fn()
}));

mockNuxtImport('useCookie', () => {
  return <T>(name: string) => {
    if (name === 'theme-id') {
      return hoisted.themeCookie as Ref<T>;
    }

    return hoisted.customColorCookie as Ref<T>;
  };
});

mockNuxtImport('useHead', () => hoisted.useHeadSpy);

describe('theme-init plugin', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.removeProperty('--color-primary-h');
    document.documentElement.style.removeProperty('--color-primary-s');
    document.documentElement.style.removeProperty('--color-primary-l');
    document.documentElement.style.removeProperty('--color-primary-foreground');
    hoisted.themeCookie.value = 'dark';
    hoisted.customColorCookie.value = '#336699';
    hoisted.useHeadSpy.mockClear();
  });

  it('hydrates theme and custom color from cookies', () => {
    const nuxtApp = {
      $i18n: {
        mergeLocaleMessage: vi.fn()
      }
    };

    if (typeof themeInitPlugin === 'function') {
      themeInitPlugin(nuxtApp as never);
    }

    const store = useThemeStore();

    expect(store.themeId).toBe('dark');
    expect(store.customColor?.hex).toBe('#336699');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--color-primary-h')).not.toBe('');
    expect(hoisted.useHeadSpy).toHaveBeenCalled();
  });
});
