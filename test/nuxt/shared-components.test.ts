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
import AppToggle from '@/components/shared/Toggle.vue';
import AppTooltip from '@/components/shared/Tooltip.vue';

describe('Shared Components', () => {
  it('renders AppAvatar', async () => {
    const wrapper = await mountSuspended(AppAvatar, { props: { fallback: 'AB' } });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('A');
  });

  it('renders AppBadge', async () => {
    const wrapper = await mountSuspended(AppBadge, { slots: { default: () => 'New' } });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('New');
  });

  it('renders AppCard', async () => {
    const wrapper = await mountSuspended(AppCard, { slots: { default: () => 'Content' } });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Content');
  });

  it('renders AppCheckbox', async () => {
    const wrapper = await mountSuspended(AppCheckbox, { props: { label: 'Check me' } });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Check me');
  });

  it('renders AppIcon', async () => {
    const wrapper = await mountSuspended(AppIcon, { props: { name: 'ph:user' } });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders AppInput', async () => {
    const wrapper = await mountSuspended(AppInput, { props: { placeholder: 'Type here' } });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('input').attributes('placeholder')).toBe('Type here');
  });

  it('renders AppModal', async () => {
    const wrapper = await mountSuspended(AppModal, { props: { modelValue: true, title: 'Modal Title' } });
    expect(wrapper.exists()).toBe(true);
  });

  it('renders AppSelect', async () => {
    const wrapper = await mountSuspended(AppSelect, { 
      props: { 
        options: [{ label: 'Option 1', value: '1' }] 
      } 
    });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Option 1');
  });

  it('renders AppSpinner', async () => {
    const wrapper = await mountSuspended(AppSpinner);
    expect(wrapper.exists()).toBe(true);
  });

  it('renders AppTextarea', async () => {
    const wrapper = await mountSuspended(AppTextarea, { props: { placeholder: 'Long text' } });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('textarea').attributes('placeholder')).toBe('Long text');
  });

  it('renders AppToggle', async () => {
    const wrapper = await mountSuspended(AppToggle, { props: { label: 'Switch me' } });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Switch me');
  });

  it('renders AppTooltip', async () => {
    const wrapper = await mountSuspended(AppTooltip, { props: { text: 'Tooltip info' } });
    expect(wrapper.exists()).toBe(true);
  });
});
