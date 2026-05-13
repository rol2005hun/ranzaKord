import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import HomeHero from '~/features/home/components/HomeHero.vue';

describe('HomeHero', () => {
  it('renders without crashing', async () => {
    const wrapper = await mountSuspended(HomeHero);
    expect(wrapper.exists()).toBe(true);
  });

  it('has a section element', async () => {
    const wrapper = await mountSuspended(HomeHero);
    expect(wrapper.find('section').exists()).toBe(true);
  });
});
