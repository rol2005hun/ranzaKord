import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../../app/app.vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { ref } from 'vue';
import * as tauriCore from '@tauri-apps/api/core';
import { createPinia, setActivePinia } from 'pinia';

// Mock Tauri
vi.mock('@tauri-apps/api/core', () => ({
  isTauri: vi.fn()
}));

const mockGetCurrentWindow = vi.fn().mockReturnValue({ show: vi.fn() });
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => mockGetCurrentWindow(),
  Window: {
    getByLabel: vi.fn().mockResolvedValue({ close: vi.fn() })
  }
}));

const mockThemeId = ref('dark');
const mockCustomPalette = ref<{ primary: { h: number; s: number; l: number } } | null>(null);

mockNuxtImport('useTheme', () => {
  return () => ({
    themeId: mockThemeId,
    currentCustomPalette: mockCustomPalette
  });
});

mockNuxtImport('useI18n', () => {
  return () => ({
    locale: { value: 'en' },
    t: (key: string) => key
  });
});

mockNuxtImport('useAppUpdate', () => {
  return () => ({
    showUpdateModal: ref(false),
    updateInfo: ref({ available: false }),
    checkForUpdates: vi.fn()
  });
});

const { mockUseHead } = vi.hoisted(() => ({
  mockUseHead: vi.fn()
}));
mockNuxtImport('useHead', () => mockUseHead);

describe('app.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockThemeId.value = 'dark';
    mockCustomPalette.value = null;
    vi.mocked(tauriCore.isTauri).mockReturnValue(false);
    if (typeof window !== 'undefined') {
      delete (window as unknown as Window & Record<string, unknown>).__TAURI_INTERNALS__;
    }
    setActivePinia(createPinia());
  });

  const mountApp = () => {
    return mount(App, {
      global: {
        stubs: {
          NuxtRouteAnnouncer: true,
          NuxtLayout: { template: '<div><slot/></div>' },
          NuxtPage: true,
          AppToast: true,
          NuxtErrorBoundary: { template: '<div><slot/></div>' },
          ClientOnly: { template: '<div><slot/></div>' },
          AppUpdateModal: true,
          AppTitlebar: true
        }
      }
    });
  };

  it('renders correctly', () => {
    const wrapper = mountApp();
    expect(wrapper.find('nuxt-route-announcer-stub').exists()).toBe(true);
    expect(wrapper.find('nuxt-page-stub').exists()).toBe(true);
    expect(wrapper.find('.app-version-overlay').exists()).toBe(true);
  });

  it('calls useHead with proper theme and locale', () => {
    mockThemeId.value = 'light';
    mountApp();
    expect(mockUseHead).toHaveBeenCalled();
    const calls = mockUseHead.mock.calls;
    const headArg = calls[calls.length - 1]?.[0];
    expect(headArg).toBeDefined();
    const headObj = typeof headArg === 'function' ? headArg() : headArg;
    expect(headObj.htmlAttrs['data-theme']).toBe('light');
    expect(headObj.htmlAttrs['lang']).toBe('en');
  });

  it('calls getCurrentWindow.show() if in Tauri', async () => {
    vi.mocked(tauriCore.isTauri).mockReturnValue(true);
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      value: true,
      configurable: true
    });
    mountApp();

    // Wait for the component to mount, dynamic imports, and the setTimeout to trigger
    await vi.waitFor(
      () => {
        expect(mockGetCurrentWindow().show).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });
});
