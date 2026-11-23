import { describe, it, expect, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { usePwaInstall } from '@/composables/usePwaInstall';
import DownloadModal from '@/components/shared/DownloadModal.vue';

describe('usePwaInstall', () => {
  it('initializes with default values', () => {
    const { isInstallable, isInstalled } = usePwaInstall();
    expect(isInstallable.value).toBe(false);
    expect(isInstalled.value).toBe(false);
  });

  it('handles beforeinstallprompt and promptInstall', async () => {
    const { isInstallable, promptInstall } = usePwaInstall();

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted'; platform: string }>;
    };
    event.prompt = mockPrompt;
    event.userChoice = mockChoice;

    window.dispatchEvent(event);

    expect(isInstallable.value).toBe(true);

    const outcome = await promptInstall();
    expect(mockPrompt).toHaveBeenCalled();
    expect(outcome).toBe('accepted');
    expect(isInstallable.value).toBe(false);
  });
});

describe('DownloadModal', () => {
  it('renders download options when open', async () => {
    const wrapper = await mountSuspended(DownloadModal, {
      props: {
        modelValue: true
      },
      global: {
        stubs: {
          AppModal: {
            template: '<div v-if="modelValue"><slot /></div>',
            props: ['modelValue']
          }
        }
      }
    });

    expect(wrapper.find('.download-card--pwa').exists()).toBe(true);
    expect(wrapper.find('.download-card--native').exists()).toBe(true);
  });
});
