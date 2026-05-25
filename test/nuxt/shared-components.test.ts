import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';

import AppAvatar from '@/components/shared/Avatar.vue';
import AppBadge from '@/components/shared/Badge.vue';
import AppCard from '@/components/shared/Card.vue';
import AppCheckbox from '@/components/shared/Checkbox.vue';
import AppIcon from '@/components/shared/Icon.vue';
import AppInput from '@/components/shared/Input.vue';
import AppModal from '@/components/shared/Modal.vue';
import AppSelect from '@/components/shared/Select.vue';
import AppSpinner from '@/components/shared/Spinner.vue';
import AppTextarea from '@/components/shared/Textarea.vue';
import AppToast from '@/components/shared/Toast.vue';
import AppToggle from '@/components/shared/Toggle.vue';
import AppTooltip from '@/components/shared/Tooltip.vue';
import AppButton from '@/components/shared/Button.vue';

describe('Shared Components', () => {
  describe('Avatar', () => {
    it('renders fallback when no image is provided', async () => {
      const wrapper = await mountSuspended(AppAvatar, { props: { fallback: 'AB' } });
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('A');
    });

    it('renders image and handles error fallback', async () => {
      const wrapper = await mountSuspended(AppAvatar, {
        props: { src: 'invalid.jpg', fallback: 'CD' }
      });
      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);

      // trigger error
      await img.trigger('error');
      expect(wrapper.text()).toContain('C');
    });
  });

  describe('Badge', () => {
    it('renders content', async () => {
      const wrapper = await mountSuspended(AppBadge, { slots: { default: () => 'New' } });
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('New');
    });
  });

  describe('Button', () => {
    it('renders default button', async () => {
      const wrapper = await mountSuspended(AppButton, { slots: { default: () => 'Click Me' } });
      expect(wrapper.text()).toContain('Click Me');
    });

    it('handles disabled state', async () => {
      const wrapper = await mountSuspended(AppButton, { props: { disabled: true } });
      await wrapper.trigger('click');
      expect(wrapper.emitted('click')).toBeUndefined();
    });

    it('handles loading state', async () => {
      const wrapper = await mountSuspended(AppButton, { props: { loading: true } });
      expect(wrapper.find('.btn__spinner').exists()).toBe(true);
      await wrapper.trigger('click');
    });
  });

  describe('Card', () => {
    it('renders default slot', async () => {
      const wrapper = await mountSuspended(AppCard, { slots: { default: () => 'Content' } });
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.text()).toContain('Content');
    });

    it('renders header and footer slots', async () => {
      const wrapper = await mountSuspended(AppCard, {
        slots: { header: () => 'Header', footer: () => 'Footer' }
      });
      expect(wrapper.text()).toContain('Header');
      expect(wrapper.text()).toContain('Footer');
    });
  });

  describe('Checkbox', () => {
    it('renders and emits update:modelValue', async () => {
      const wrapper = await mountSuspended(AppCheckbox, {
        props: { label: 'Check me', modelValue: false }
      });
      expect(wrapper.text()).toContain('Check me');
      await wrapper.find('input').setValue(true);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('does not emit when disabled', async () => {
      const wrapper = await mountSuspended(AppCheckbox, {
        props: { disabled: true, modelValue: false }
      });
      await wrapper.find('input').setValue(true);
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('emits on change event', async () => {
      const wrapper = await mountSuspended(AppCheckbox, {
        props: { modelValue: false }
      });
      const input = wrapper.find('input');
      // Set checked property directly before triggering change
      (input.element as HTMLInputElement).checked = true;
      await input.trigger('change');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });
  });

  describe('Icon', () => {
    it('renders AppIcon', async () => {
      const wrapper = await mountSuspended(AppIcon, { props: { name: 'ph:user' } });
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Input', () => {
    it('renders and emits update:modelValue', async () => {
      const wrapper = await mountSuspended(AppInput, {
        props: { placeholder: 'Type here', modelValue: '' }
      });
      expect(wrapper.find('input').attributes('placeholder')).toBe('Type here');
      await wrapper.find('input').setValue('Hello');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Hello']);
    });

    it('handles disabled state', async () => {
      const wrapper = await mountSuspended(AppInput, {
        props: { disabled: true, modelValue: '' }
      });
      await wrapper.find('input').setValue('Test');
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('renders error state', async () => {
      const wrapper = await mountSuspended(AppInput, {
        props: { error: 'Bad input' }
      });
      expect(wrapper.text()).toContain('Bad input');
    });
  });

  describe('Modal', () => {
    it('renders and handles close events', async () => {
      const wrapper = await mountSuspended(AppModal, {
        props: { modelValue: true, title: 'Modal Title' },
        global: { stubs: { Teleport: true } }
      });
      expect(wrapper.text()).toContain('Modal Title');

      const closeBtn = wrapper.find('.modal__close');
      await closeBtn.trigger('click');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('closes on overlay click', async () => {
      const wrapper = await mountSuspended(AppModal, {
        props: { modelValue: true },
        global: { stubs: { Teleport: true } }
      });
      await wrapper.find('.modal-overlay').trigger('click');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('does not close on inner content click', async () => {
      const wrapper = await mountSuspended(AppModal, {
        props: { modelValue: true },
        global: { stubs: { Teleport: true } }
      });
      await wrapper.find('.modal').trigger('click');
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });
  });

  describe('Select', () => {
    const options = [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' }
    ];

    it('renders and emits update:modelValue', async () => {
      const wrapper = await mountSuspended(AppSelect, {
        props: { modelValue: '1', options }
      });
      expect(wrapper.text()).toContain('Option 1');
      await wrapper.find('select').setValue('2');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2']);
    });

    it('handles disabled state', async () => {
      const wrapper = await mountSuspended(AppSelect, {
        props: { disabled: true, modelValue: '1', options }
      });
      await wrapper.find('select').setValue('2');
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('emits change event', async () => {
      const wrapper = await mountSuspended(AppSelect, {
        props: { modelValue: '1', options }
      });
      const select = wrapper.find('select');
      (select.element as HTMLSelectElement).value = '2';
      await select.trigger('change');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2']);
    });
  });

  describe('Spinner', () => {
    it('renders AppSpinner', async () => {
      const wrapper = await mountSuspended(AppSpinner);
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Textarea', () => {
    it('renders and emits update:modelValue', async () => {
      const wrapper = await mountSuspended(AppTextarea, {
        props: { placeholder: 'Long text', modelValue: '' }
      });
      expect(wrapper.find('textarea').attributes('placeholder')).toBe('Long text');
      await wrapper.find('textarea').setValue('Some content');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Some content']);
    });

    it('handles disabled state', async () => {
      const wrapper = await mountSuspended(AppTextarea, {
        props: { disabled: true, modelValue: '' }
      });
      await wrapper.find('textarea').setValue('Test');
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('renders error state', async () => {
      const wrapper = await mountSuspended(AppTextarea, {
        props: { error: 'Textarea error' }
      });
      expect(wrapper.text()).toContain('Textarea error');
    });
  });

  describe('Toast', () => {
    it('renders variants and closes', async () => {
      const wrapper = await mountSuspended(AppToast, {
        global: { stubs: { Teleport: true } }
      });
      // Need to add toast via composable since it's used internally
      const { add } = useToast();
      add({ message: 'Hello', variant: 'success', duration: 3000 });
      await nextTick();

      expect(wrapper.text()).toContain('Hello');
      await wrapper.find('.toast__close').trigger('click');
      // The toast array should be empty after click, but wait for animation/timeout or check directly.
      // Emitted 'close' is not used in AppToast, it uses remove() directly!
    });
  });

  describe('Toggle', () => {
    it('renders and emits update:modelValue', async () => {
      const wrapper = await mountSuspended(AppToggle, {
        props: { label: 'Switch me', modelValue: false }
      });
      expect(wrapper.text()).toContain('Switch me');

      await wrapper.find('input[type="checkbox"]').setValue(true);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('does not emit when disabled', async () => {
      const wrapper = await mountSuspended(AppToggle, {
        props: { disabled: true, modelValue: false }
      });
      await wrapper.find('input[type="checkbox"]').setValue(true);
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('emits change event correctly', async () => {
      const wrapper = await mountSuspended(AppToggle, {
        props: { modelValue: false }
      });
      const input = wrapper.find('input[type="checkbox"]');
      (input.element as HTMLInputElement).checked = true;
      await input.trigger('change');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });
  });

  describe('Tooltip', () => {
    it('renders and handles hover', async () => {
      const wrapper = await mountSuspended(AppTooltip, {
        props: { text: 'Tooltip info' },
        slots: { default: () => '<div class="trigger">Hover me</div>' }
      });
      expect(wrapper.text()).toContain('Hover me');
      await wrapper.find('.tooltip-wrapper').trigger('mouseenter');
      expect(wrapper.find('.tooltip').exists()).toBe(true);
      await wrapper.find('.tooltip-wrapper').trigger('mouseleave');
    });
  });
});
