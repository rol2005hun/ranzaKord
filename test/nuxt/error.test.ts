import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NuxtError } from '#app';
import { mount } from '@vue/test-utils';
import ErrorPage from '../../app/error.vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { createPinia, setActivePinia } from 'pinia';
import { useThemeStore } from '../../app/features/theme/stores/useThemeStore';

const { mockClearError } = vi.hoisted(() => ({
  mockClearError: vi.fn()
}));

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string) => key
  });
});

mockNuxtImport('clearError', () => mockClearError);
mockNuxtImport('useHead', () => vi.fn());

describe('error.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    const themeStore = useThemeStore();
    themeStore.themeId = 'dark';
  });

  const mountError = (statusCode: number, message?: string, stack?: string) => {
    return mount(ErrorPage, {
      props: {
        error: {
          statusCode,
          message: message || '',
          stack: stack || '',
          name: 'Error',
          fatal: true
        } as unknown as NuxtError
      },
      global: {
        stubs: {
          AppIcon: true,
          AppButton: {
            template: '<button @click="$emit(\'click\')"><slot/></button>'
          }
        }
      }
    });
  };

  it('renders 404 layout properly', () => {
    const wrapper = mountError(404);

    expect(wrapper.find('.header-text').text()).toContain('404');
    expect(wrapper.find('.error-title').text()).toBe('core.error.notFound');
    // 404 should not render stack trace
    expect(wrapper.find('.error-code-block').exists()).toBe(false);
  });

  it('renders generic 500 error properly', () => {
    const wrapper = mountError(500, 'Custom error message');

    expect(wrapper.find('.header-text').text()).toContain('500');
    expect(wrapper.find('.error-title').text()).toBe('core.error.fatalTitle');
    expect(wrapper.find('.error-desc').text()).toBe('core.error.fatalDescription');

    // Should render code block for message
    expect(wrapper.find('.error-code-block').exists()).toBe(true);
    expect(wrapper.find('.message').text()).toBe('Custom error message');
    expect(wrapper.find('.stack').exists()).toBe(false);
  });

  it('renders stack trace if available on 500 error', () => {
    const wrapper = mountError(500, 'Error', 'Error: Stack trace here');

    expect(wrapper.find('.stack').exists()).toBe(true);
    expect(wrapper.find('.stack').text()).toBe('Error: Stack trace here');
  });

  it('calls clearError when home button is clicked', async () => {
    const wrapper = mountError(500);

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(mockClearError).toHaveBeenCalledWith({ redirect: '/' });
  });
});
