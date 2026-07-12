import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SleepTimerButton from '../../app/features/player/components/SleepTimerButton.vue';
import { createTestingPinia } from '@pinia/testing';

vi.mock('../../app/features/player/composables/useSleepTimer', () => ({
  useSleepTimer: () => ({
    isActive: false,
    remainingSeconds: 0,
    sleepTimerMode: { value: 'off' },
    setTimer: vi.fn(),
    cancelTimer: vi.fn(),
    formatTime: (secs: number) => `${secs}s`
  })
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (k: string) => k })
}));

describe('SleepTimerButton.vue', () => {
  it('renders correctly', async () => {
    const pinia = createTestingPinia({ stubActions: false, createSpy: vi.fn });
    const wrapper = mount(SleepTimerButton, {
      global: {
        plugins: [pinia],
        stubs: {
          AppButton: true,
          AppIcon: true,
          AppTooltip: {
            template: '<div><slot/></div>'
          }
        },
        mocks: {
          $t: (msg: string) => msg
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
  });
});
