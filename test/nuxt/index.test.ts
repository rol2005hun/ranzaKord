import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Index from '../../app/pages/index.vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string) => key
  });
});

mockNuxtImport('useHead', () => vi.fn());
mockNuxtImport('definePageMeta', () => vi.fn());

describe('index.vue', () => {
  it('renders HomeHero component', () => {
    const wrapper = mount(Index, {
      global: {
        stubs: {
          HomeHero: { template: '<div class="mock-home-hero"></div>' }
        }
      }
    });
    expect(wrapper.find('.mock-home-hero').exists()).toBe(true);
  });
});
