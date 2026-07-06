import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SearchCategoryTabs from '../../app/features/search/components/SearchCategoryTabs.vue';

describe('SearchCategoryTabs', () => {
  it('renders all tabs', () => {
    const wrapper = mount(SearchCategoryTabs, {
      props: {
        modelValue: 'all'
      }
    });

    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBe(4);
    expect(buttons[0]?.text()).toBe('All');
    expect(buttons[1]?.text()).toBe('Songs');
    expect(buttons[2]?.text()).toBe('Artists');
    expect(buttons[3]?.text()).toBe('Albums');
  });

  it('adds active class to selected tab', () => {
    const wrapper = mount(SearchCategoryTabs, {
      props: {
        modelValue: 'song'
      }
    });

    const buttons = wrapper.findAll('button');
    expect(buttons[0]?.classes()).not.toContain('search-category-tabs__tab--active');
    expect(buttons[1]?.classes()).toContain('search-category-tabs__tab--active');
  });

  it('emits update:modelValue when a tab is clicked', async () => {
    const wrapper = mount(SearchCategoryTabs, {
      props: {
        modelValue: 'all'
      }
    });

    const buttons = wrapper.findAll('button');
    if (buttons[2]) {
      await buttons[2].trigger('click');
    }

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['artist']);
  });
});
