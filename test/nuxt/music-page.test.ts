import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MusicPage from '@/components/shared/MusicPage.vue';

describe('MusicPage Component', () => {
  it('renders loading skeleton when isLoading is true', () => {
    const wrapper = mount(MusicPage, {
      props: {
        isLoading: true
      },
      global: {
        stubs: {
          AppIcon: true,
          NuxtImg: true
        }
      }
    });

    expect(wrapper.find('.music-page__skeleton').exists()).toBe(true);
    expect(wrapper.find('.music-page__error').exists()).toBe(false);
    expect(wrapper.find('.music-page__header').exists()).toBe(false);
  });

  it('renders error state when isError is true', () => {
    const wrapper = mount(MusicPage, {
      props: {
        isError: true,
        errorText: 'Failed to load'
      },
      global: {
        stubs: {
          AppIcon: true,
          NuxtImg: true
        },
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.find('.music-page__error').exists()).toBe(true);
    expect(wrapper.text()).toContain('Failed to load');
    expect(wrapper.find('.music-page__skeleton').exists()).toBe(false);
  });

  it('renders standard music page when not loading or error', () => {
    const wrapper = mount(MusicPage, {
      props: {
        isLoading: false,
        isError: false,
        title: 'Awesome Album',
        badge: 'ALBUM'
      },
      global: {
        stubs: {
          AppIcon: true,
          NuxtImg: true
        },
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.find('.music-page__header').exists()).toBe(true);
    expect(wrapper.find('.music-page__title').text()).toBe('Awesome Album');
    expect(wrapper.find('.music-page__badge').text()).toBe('ALBUM');
  });

  it('emits play-all when play button is clicked', async () => {
    const wrapper = mount(MusicPage, {
      props: {
        title: 'Awesome Album',
        showPlayButton: true
      },
      global: {
        stubs: {
          AppIcon: true,
          NuxtImg: true
        },
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    const playBtn = wrapper.find('.music-page__header-content .music-page__play-btn');
    expect(playBtn.exists()).toBe(true);

    await playBtn.trigger('click');
    expect(wrapper.emitted('play-all')).toBeTruthy();
    expect(wrapper.emitted('play-all')).toHaveLength(1);
  });

  it('handles image error emit', async () => {
    const wrapper = mount(MusicPage, {
      props: {
        imageUrl: 'http://test.com/image.jpg'
      },
      global: {
        stubs: {
          AppIcon: true,
          NuxtImg: {
            template: '<img @error="$emit(\'error\')" />'
          }
        },
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    const img = wrapper.find('img');
    await img.trigger('error');
    expect(wrapper.emitted('image-error')).toBeTruthy();
  });
});
