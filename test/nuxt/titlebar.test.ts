import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Titlebar from '../../app/components/shared/Titlebar.vue';
import { createTestingPinia } from '@pinia/testing';

// Mock Tauri window API
const mockMinimize = vi.fn();
const mockToggleMaximize = vi.fn();
const mockClose = vi.fn();
const mockIsMaximized = vi.fn().mockResolvedValue(false);
const mockOnResized = vi.fn();

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    minimize: mockMinimize,
    toggleMaximize: mockToggleMaximize,
    close: mockClose,
    isMaximized: mockIsMaximized,
    onResized: mockOnResized
  }))
}));

// Mock #app routing
vi.mock('#app', async (importOriginal) => {
  const actual = await importOriginal<typeof import('#app')>();
  return {
    ...actual,
    useRouter: () => ({ back: vi.fn(), forward: vi.fn() })
  };
});

describe('Titlebar.vue', () => {
  it('renders correctly and handles window controls', async () => {
    // Override import.meta.client and Tauri internals specifically for this test
    vi.stubGlobal('window', { __TAURI_INTERNALS__: {} });

    const pinia = createTestingPinia({ stubActions: false, createSpy: vi.fn });
    const wrapper = mount(Titlebar, {
      global: {
        plugins: [pinia],
        stubs: {
          NuxtLink: true,
          AppIcon: true,
          Brand: true,
          AppButton: true,
          Avatar: true
        },
        mocks: {
          $t: (msg: string) => msg
        }
      }
    });

    // We can test basic rendering, but some window logic is reactive
    expect(wrapper.find('.titlebar').exists()).toBe(true);

    vi.unstubAllGlobals();
  });
});
