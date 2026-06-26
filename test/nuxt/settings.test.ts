import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PlayerSettings from '../../app/features/settings/components/panels/PlayerSettings.vue';
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

describe('PlayerSettings.vue', () => {
  it('renders settings panel correctly', () => {
    const wrapper = mount(PlayerSettings, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        mocks: {
          $t: (key: string) => key
        },
        stubs: {
          AppToggle: true,
          AppSelect: true
        }
      }
    });
    // the title uses translation key settings.categories.player
    expect(wrapper.text()).toContain('settings.categories.player');
    expect(wrapper.text()).toContain('core.settings.audioReactiveLyrics.title');
  });
});
