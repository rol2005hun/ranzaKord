import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TermsModal from '../../app/features/auth/components/TermsModal.vue';

describe('TermsModal.vue', () => {
  it('renders correctly and emits close event', async () => {
    const wrapper = mount(TermsModal, {
      props: {
        modelValue: true
      },
      global: {
        stubs: {
          AppModal: true,
          AppButton: true,
          AppIcon: true
        },
        mocks: {
          $t: (msg: string) => msg
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
    // Simulate clicking the close button
    const closeBtn = wrapper.find('.terms-modal__close');
    await closeBtn.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
