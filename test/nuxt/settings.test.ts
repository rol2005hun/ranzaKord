import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Settings from '../../app/pages/settings.vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { createTestingPinia } from '@pinia/testing';

mockNuxtImport('useHead', () => vi.fn());
mockNuxtImport('definePageMeta', () => vi.fn());

// Mock usePlayerStore since settings page uses it
mockNuxtImport('usePlayerStore', () => {
  return () => ({
    isAudioReactiveLyrics: true,
    crossfadeEnabled: false
  });
});

describe('settings.vue', () => {
  it('renders settings page correctly', () => {
    const wrapper = mount(Settings, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: {
          $t: (key: string) => key
        },
        stubs: {
          AppToggle: true
        }
      }
    });
    // the title uses translation key nav.settings
    expect(wrapper.text()).toContain('nav.settings');
    expect(wrapper.text()).toContain('core.settings.audioReactiveLyrics.title');
  });
});
