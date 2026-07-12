import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Brand from '../../app/components/shared/Brand.vue';
import { createTestingPinia } from '@pinia/testing';

describe('Brand.vue', () => {
  it('renders the brand component', () => {
    const pinia = createTestingPinia({ stubActions: false, createSpy: vi.fn });
    const wrapper = mount(Brand, {
      global: {
        plugins: [pinia],
        stubs: {
          AppIcon: true
        }
      }
    });

    // Check if the logo image exists
    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('alt')).toBe('ranzaKonnect');
  });
});
