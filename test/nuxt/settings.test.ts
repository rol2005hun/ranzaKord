import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Settings from '../../app/pages/settings.vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

mockNuxtImport('useHead', () => vi.fn());
mockNuxtImport('definePageMeta', () => vi.fn());

describe('settings.vue', () => {
  it('renders settings page correctly', () => {
    const wrapper = mount(Settings);
    expect(wrapper.text()).toContain('Settings');
    expect(wrapper.text()).toContain('Settings will be available here');
  });
});
