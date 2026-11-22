import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import YouTubeSettings from '@/features/settings/components/panels/YouTubeSettings.vue';

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key,
  locale: { value: 'hu' }
}));

mockNuxtImport('useToast', () => () => ({
  success: vi.fn(),
  danger: vi.fn()
}));

const mockFetch = vi.hoisted(() => vi.fn());
mockNuxtImport('$fetch', () => mockFetch);

describe('YouTubeSettings.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mountComponent = async (initialResponse?: unknown) => {
    if (initialResponse) {
      mockFetch.mockResolvedValue(initialResponse);
    } else {
      mockFetch.mockResolvedValue({
        hasCookies: true,
        hasPoToken: true,
        hasVisitorData: true,
        hasOauth: false,
        deviceAuth: { status: 'idle' }
      });
    }

    const wrapper = await mountSuspended(YouTubeSettings, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: { $t: (k: string) => k },
        stubs: {
          AppIcon: true,
          AppButton: { template: '<button @click="$emit(\'click\')"><slot/></button>' },
          AppBadge: { template: '<span class="badge"><slot/></span>' },
          AppSkeleton: { template: '<div class="skeleton"></div>' },
          AppSpinner: { template: '<div class="spinner"></div>' },
          AppSettingsSection: { template: '<div><slot/></div>' }
        }
      }
    });

    await flushPromises();
    return wrapper;
  };

  it('renders status and labels properly', async () => {
    const wrapper = await mountComponent();
    expect(wrapper.text()).toContain('settings.youtube.title');
    expect(wrapper.text()).toContain('settings.youtube.status.cookies');
    expect(wrapper.text()).toContain('settings.youtube.status.poToken');
    expect(wrapper.text()).toContain('settings.youtube.status.visitorData');
    expect(wrapper.text()).toContain('settings.youtube.status.oauth');
  });

  it('renders skeleton loaders when status is loading', async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const wrapper = await mountSuspended(YouTubeSettings, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: { $t: (k: string) => k },
        stubs: {
          AppIcon: true,
          AppButton: { template: '<button @click="$emit(\'click\')"><slot/></button>' },
          AppBadge: { template: '<span class="badge"><slot/></span>' },
          AppSkeleton: { template: '<div class="skeleton"></div>' },
          AppSpinner: { template: '<div class="spinner"></div>' },
          AppSettingsSection: { template: '<div><slot/></div>' }
        }
      }
    });

    const skeletons = wrapper.findAll('.skeleton');
    expect(skeletons.length).toBe(4);
    expect(wrapper.text()).not.toContain('settings.youtube.status.missing');
    expect(wrapper.text()).not.toContain('settings.youtube.status.active');
  });

  it('renders connected state with reconnect and disconnect buttons when oauth is active', async () => {
    const wrapper = await mountComponent({
      hasCookies: true,
      hasPoToken: true,
      hasVisitorData: true,
      hasOauth: true,
      deviceAuth: { status: 'idle' }
    });

    expect(wrapper.text()).toContain('settings.youtube.device.success');
    expect(wrapper.text()).toContain('settings.youtube.device.reconnect');
    expect(wrapper.text()).toContain('settings.youtube.device.disconnect');
  });

  it('renders start device auth button when oauth is not active', async () => {
    const wrapper = await mountComponent({
      hasCookies: false,
      hasPoToken: false,
      hasVisitorData: false,
      hasOauth: false,
      deviceAuth: { status: 'idle' }
    });

    expect(wrapper.text()).toContain('settings.youtube.device.start');
    expect(wrapper.text()).not.toContain('settings.youtube.device.disconnect');
  });
});
