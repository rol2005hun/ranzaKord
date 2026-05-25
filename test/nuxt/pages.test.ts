import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';

import App from '@/app.vue';
import IndexPage from '@/pages/index.vue';

describe('App & Pages', () => {
  it('renders app.vue without crashing', async () => {
    const wrapper = await mountSuspended(App);
    expect(wrapper.exists()).toBe(true);
  });

  it('renders index.vue without crashing', async () => {
    const wrapper = await mountSuspended(IndexPage);
    expect(wrapper.exists()).toBe(true);
  });
});
