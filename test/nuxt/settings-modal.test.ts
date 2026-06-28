import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SettingsModal from '@/features/settings/components/SettingsModal.vue';
import { createTestingPinia } from '@pinia/testing';
import { useLayoutStore } from '@/features/core/stores/useLayoutStore';
import AccountSettings from '@/features/settings/components/panels/AccountSettings.vue';
import AppearanceSettings from '@/features/settings/components/panels/AppearanceSettings.vue';
import PlayerSettings from '@/features/settings/components/panels/PlayerSettings.vue';
import AudioSettings from '@/features/settings/components/panels/AudioSettings.vue';

// Mock child components
vi.mock('@/features/settings/components/panels/AccountSettings.vue', () => ({
  default: {
    name: 'AccountSettings',
    template: '<div class="mock-account">Account</div>'
  }
}));

vi.mock('@/features/settings/components/panels/AppearanceSettings.vue', () => ({
  default: {
    name: 'AppearanceSettings',
    template: '<div class="mock-appearance">Appearance</div>'
  }
}));

vi.mock('@/features/settings/components/panels/PlayerSettings.vue', () => ({
  default: {
    name: 'PlayerSettings',
    template: '<div class="mock-player">Player</div>'
  }
}));

vi.mock('@/features/settings/components/panels/AudioSettings.vue', () => ({
  default: {
    name: 'AudioSettings',
    template: '<div class="mock-audio">Audio</div>'
  }
}));

// Mock AppModal since it's a global component
const AppModal = {
  name: 'AppModal',
  template: '<div class="app-modal"><slot /></div>',
  props: ['modelValue']
};

describe('SettingsModal.vue', () => {
  const mountComponent = () => {
    return mount(SettingsModal, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              layout: {
                isSettingsOpen: true
              }
            }
          })
        ],
        components: {
          AppModal,
          AccountSettings,
          AppearanceSettings,
          PlayerSettings,
          AudioSettings
        },
        stubs: {
          AppIcon: true,
          AppModal: AppModal
        },
        mocks: {
          $t: (msg: string) => msg
        }
      }
    });
  };

  it('renders account settings by default', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.mock-account').exists()).toBe(true);
    expect(wrapper.find('.mock-appearance').exists()).toBe(false);
  });

  it('switches to appearance tab when clicked', async () => {
    const wrapper = mountComponent();

    // Find appearance tab button
    const tabs = wrapper.findAll('.settings-modal__tab');
    const appearanceTab = tabs.find((t) => t.text().includes('settings.categories.appearance'));

    expect(appearanceTab).toBeDefined();
    if (appearanceTab) {
      await appearanceTab.trigger('click');
    }

    expect(wrapper.find('.mock-appearance').exists()).toBe(true);
    expect(wrapper.find('.mock-account').exists()).toBe(false);
  });

  it('switches to player and audio tabs correctly', async () => {
    const wrapper = mountComponent();
    const tabs = wrapper.findAll('.settings-modal__tab');

    const playerTab = tabs.find((t) => t.text().includes('settings.categories.player'));
    if (playerTab) await playerTab.trigger('click');
    expect(wrapper.find('.mock-player').exists()).toBe(true);

    const audioTab = tabs.find((t) => t.text().includes('settings.categories.audio'));
    if (audioTab) await audioTab.trigger('click');
    expect(wrapper.find('.mock-audio').exists()).toBe(true);
  });

  it('calls closeSettings on close button click', async () => {
    const wrapper = mountComponent();
    const layoutStore = useLayoutStore();

    await wrapper.find('.settings-modal__close').trigger('click');

    expect(layoutStore.closeSettings).toHaveBeenCalled();
  });
});
