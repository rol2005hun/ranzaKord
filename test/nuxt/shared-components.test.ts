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

    it('renders as anchor when href is provided', async () => {
      const wrapper = await mountSuspended(AppButton, { props: { href: 'https://example.com' } });
      expect(wrapper.element.tagName).toBe('A');
      expect(wrapper.attributes('href')).toBe('https://example.com');
      expect(wrapper.attributes('type')).toBeUndefined();
      expect(wrapper.attributes('disabled')).toBeUndefined();
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
      (input.element as HTMLInputElement).checked = true;
      await input.trigger('change');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    });

    it('renders checked state', async () => {
      const wrapper = await mountSuspended(AppCheckbox, {
        props: { modelValue: true }
      });
      expect(wrapper.find('svg').exists()).toBe(true);
      expect(wrapper.find('.checkbox__box').classes()).toContain('checkbox__box--checked');
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

    it('closes on escape key', async () => {
      const wrapper = await mountSuspended(AppModal, {
        props: { modelValue: true },
        global: { stubs: { Teleport: true } }
      });
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('does not close on escape key when persistent', async () => {
      const wrapper = await mountSuspended(AppModal, {
        props: { modelValue: true, persistent: true },
        global: { stubs: { Teleport: true } }
      });
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();

      // also test overlay click when persistent
      await wrapper.find('.modal-overlay').trigger('click.self');
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('adds and removes event listeners correctly', async () => {
      const wrapper = await mountSuspended(AppModal, {
        props: { modelValue: false },
        global: { stubs: { Teleport: true } }
      });

      // trigger watch
      await wrapper.setProps({ modelValue: true });
      expect(document.body.style.overflow).toBe('hidden');

      await wrapper.setProps({ modelValue: false });
      expect(document.body.style.overflow).toBe('');

      await wrapper.setProps({ modelValue: true });
      wrapper.unmount();
      expect(document.body.style.overflow).toBe('');
    });

    it('renders footer slot', async () => {
      const wrapper = await mountSuspended(AppModal, {
        props: { modelValue: true },
        slots: { footer: () => 'Footer content' },
        global: { stubs: { Teleport: true } }
      });
      expect(wrapper.text()).toContain('Footer content');
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
      await wrapper.find('.select-container').trigger('click');
      const optionsNodes = wrapper.findAll('.select-option');
      await optionsNodes[1]?.trigger('click');
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2']);
    });

    it('handles disabled state', async () => {
      const wrapper = await mountSuspended(AppSelect, {
        props: { disabled: true, modelValue: '1', options }
      });
      await wrapper.find('.select-container').trigger('click');
      expect(wrapper.find('.select-dropdown').exists()).toBe(false);
    });

    it('opens dropdown on click', async () => {
      const wrapper = await mountSuspended(AppSelect, {
        props: { modelValue: '1', options }
      });
      await wrapper.find('.select-container').trigger('click');
      expect(wrapper.find('.select-dropdown').exists()).toBe(true);
    });

    it('renders placeholder', async () => {
      const wrapper = await mountSuspended(AppSelect, {
        props: { modelValue: '', options, placeholder: 'Select an option' }
      });
      expect(wrapper.text()).toContain('Select an option');
    });

    it('handles error state', async () => {
      const wrapper = await mountSuspended(AppSelect, {
        props: { error: 'Select error', modelValue: '1', options, id: 'test-select' }
      });
      expect(wrapper.text()).toContain('Select error');
      expect(wrapper.find('.select-container').classes()).toContain('select-container--error');
    });

    it('handles error state without id', async () => {
      const wrapper = await mountSuspended(AppSelect, {
        props: { error: 'Select error no id', modelValue: '1', options }
      });
      expect(wrapper.text()).toContain('Select error no id');
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
        props: { error: 'Textarea error', id: 'test-textarea' }
      });
      expect(wrapper.text()).toContain('Textarea error');
    });

    it('renders error state without id', async () => {
      const wrapper = await mountSuspended(AppTextarea, {
        props: { error: 'Textarea error no id' }
      });
      expect(wrapper.text()).toContain('Textarea error no id');
    });
  });

  describe('Toast', () => {
    it('renders variants and closes', async () => {
      const wrapper = await mountSuspended(AppToast, {
        global: { stubs: { Teleport: true } }
      });
      const { add } = useToast();
      add({ message: 'Success message', variant: 'success', duration: 3000 });
      add({ message: 'Danger message', variant: 'danger', duration: 3000 });
      add({ message: 'Warning message', variant: 'warning', duration: 3000 });
      add({ message: 'Info message', variant: 'info', duration: 3000 });
      await nextTick();

      expect(wrapper.text()).toContain('Success message');
      expect(wrapper.text()).toContain('Danger message');
      expect(wrapper.text()).toContain('Warning message');
      expect(wrapper.text()).toContain('Info message');

      const closeBtns = wrapper.findAll('.toast__close');
      await closeBtns[0]?.trigger('click');
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
