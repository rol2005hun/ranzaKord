import { describe, it, expect, beforeEach, vi } from 'vitest';

import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent } from 'vue';
import { useUpdaterStore } from '@/features/updater/stores/useUpdaterStore';
import { useAppUpdate } from '@/features/core/composables/useAppUpdate';
import UpdateModal from '@/components/shared/UpdateModal.vue';

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn()
}));

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: vi.fn()
}));

vi.mock('@tauri-apps/plugin-opener', () => ({
  openUrl: vi.fn()
}));

const TestComponent = defineComponent({
  setup() {
    return useAppUpdate();
  },
  template: '<div></div>'
});

describe('Updater Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const store = useUpdaterStore();
    store.hasChecked = false;
    store.showModal = false;
    store.patch({
      available: false,
      version: '',
      body: '',
      date: undefined,
      isMandatory: false,
      downloading: false,
      progress: 0,
      total: 0,
      error: null,
      apkDownloadUrl: null
    });
  });

  describe('useAppUpdate Composable', () => {
    it('initializes with default values', async () => {
      const wrapper = await mountSuspended(TestComponent);
      const { updateInfo, showUpdateModal } = wrapper.vm;

      expect(showUpdateModal).toBe(false);
      expect(updateInfo.available).toBe(false);
      expect(updateInfo.version).toBe('');
    });
  });

  describe('UpdateModal.vue Component', () => {
    it('does not render when modelValue is false', async () => {
      const wrapper = await mountSuspended(UpdateModal, {
        props: { modelValue: false },
        global: {
          stubs: {
            AppModal: {
              template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>',
              props: ['modelValue']
            },
            AppIcon: true,
            AppButton: true
          }
        }
      });
      expect(wrapper.text()).not.toContain('1.2.3');
    });

    it('renders update information when active', async () => {
      const store = useUpdaterStore();
      store.patch({
        available: true,
        version: '1.2.3',
        body: 'New features and bug fixes',
        isMandatory: false,
        apkDownloadUrl: null
      });

      const wrapper = await mountSuspended(UpdateModal, {
        props: { modelValue: true },
        global: {
          stubs: {
            AppModal: {
              template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>',
              props: ['modelValue']
            },
            AppIcon: true,
            AppButton: true
          }
        }
      });

      expect(wrapper.text()).toContain('1.2.3');
      expect(wrapper.text()).toContain('New features and bug fixes');
    });

    it('renders a direct download button when apkDownloadUrl is present', async () => {
      const store = useUpdaterStore();
      store.patch({
        available: true,
        version: '1.2.3',
        body: 'Mobile update',
        isMandatory: true,
        apkDownloadUrl: 'https://github.com/test/download.apk'
      });

      const wrapper = await mountSuspended(UpdateModal, {
        props: { modelValue: true },
        global: {
          stubs: {
            AppModal: {
              template: '<div v-if="modelValue"><slot/><slot name="footer"/></div>',
              props: ['modelValue']
            },
            AppIcon: true,
            AppButton: {
              template: '<button @click="$emit(\'click\')"><slot/></button>'
            }
          }
        }
      });

      // Since it's mandatory, skip button is not there, only the download button
      const downloadBtn = wrapper.find('button');
      expect(downloadBtn.exists()).toBe(true);

      // Test the openUrl behavior
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await downloadBtn.trigger('click');

      // wait for promise tick
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(openUrl).toHaveBeenCalledWith('https://github.com/test/download.apk');
    });
  });
});
