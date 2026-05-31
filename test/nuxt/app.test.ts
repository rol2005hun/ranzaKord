import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../../app/app.vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { ref } from 'vue';
import * as tauriCore from '@tauri-apps/api/core';

// Mock Tauri
vi.mock('@tauri-apps/api/core', () => ({
  isTauri: vi.fn()
}));

const mockGetCurrentWindow = vi.fn().mockReturnValue({ show: vi.fn() });
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => mockGetCurrentWindow()
}));

const mockThemeId = ref('dark');
const mockCustomColor = ref<{ h: number; s: number; l: number } | null>(null);

mockNuxtImport('useTheme', () => {
  return () => ({
    themeId: mockThemeId,
    customColor: mockCustomColor
  });
});

mockNuxtImport('useI18n', () => {
  return () => ({
    locale: ref('en'),
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

mockNuxtImport('useHead', () => vi.fn());

describe('app.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockThemeId.value = 'dark';
    mockCustomColor.value = null;
    vi.mocked(tauriCore.isTauri).mockReturnValue(false);
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
          AppUpdateModal: true
        }
      }
    });
  };

  it('renders correctly', () => {
    const wrapper = mountApp();
    expect(wrapper.find('nuxt-route-announcer-stub').exists()).toBe(true);
    expect(wrapper.find('nuxt-page-stub').exists()).toBe(true);
  });

  it('calls getCurrentWindow.show() if in Tauri', async () => {
    vi.mocked(tauriCore.isTauri).mockReturnValue(true);
    mountApp();

    // Wait for the component to mount and the setTimeout to trigger
    await new Promise((r) => setTimeout(r, 60));

    expect(mockGetCurrentWindow().show).toHaveBeenCalled();
  });
});
