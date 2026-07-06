import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TopResultCard from '../../app/features/search/components/TopResultCard.vue';
import { usePlayerStore } from '../../app/features/player/stores/usePlayerStore';
import { createPinia, setActivePinia } from 'pinia';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string) => key
  });
});

const NuxtLinkStub = {
  name: 'NuxtLink',
  template: '<a><slot/></a>',
  props: ['to']
};

describe('TopResultCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const baseResult = {
    id: '123',
    title: 'Test Title',
    artist: 'Test Artist',
    thumbnailUrl: 'thumb.jpg'
  };

  it('renders artist correctly', () => {
    const result = { ...baseResult, type: 'artist' as const };
    const wrapper = mount(TopResultCard, {
      props: { result },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { NuxtLink: NuxtLinkStub, NuxtImg: true, AppIcon: true, ClientOnly: true }
      }
    });

    expect(wrapper.find('.top-result-card__image-container').classes()).toContain(
      'top-result-card__image-container--artist'
    );
    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.text()).toContain('artist');
    expect(wrapper.findComponent({ name: 'NuxtLink' }).props('to')).toBe('/artist/123');
  });

  it('renders album correctly', () => {
    const result = { ...baseResult, type: 'album' as const, artistId: 'a1' };
    const wrapper = mount(TopResultCard, {
      props: { result },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { NuxtLink: NuxtLinkStub, NuxtImg: true, AppIcon: true, ClientOnly: true }
      }
    });

    expect(wrapper.text()).toContain('Test Title');
    expect(wrapper.text()).toContain('album');
    const links = wrapper.findAllComponents({ name: 'NuxtLink' });
    expect(links[0]?.props('to')).toBe('/album/123');
    expect(links[1]?.props('to')).toBe('/artist/a1');
  });

  it('renders song correctly and handles play', async () => {
    const result = { ...baseResult, type: 'song' as const };
    const wrapper = mount(TopResultCard, {
      props: { result },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { NuxtLink: NuxtLinkStub, NuxtImg: true, AppIcon: true, ClientOnly: true }
      }
    });

    expect(wrapper.text()).toContain('song');
    expect(wrapper.find('.top-result-card__play-btn').exists()).toBe(true);

    await wrapper.find('.top-result-card__play-btn').trigger('click');
    expect(wrapper.emitted('play')?.[0]).toEqual([result]);
  });

  it('shows active state if playing', () => {
    const result = { ...baseResult, type: 'song' as const };
    const playerStore = usePlayerStore();
    playerStore.setTrack({
      videoId: '123',
      title: '',
      artist: '',
      durationSeconds: 0,
      thumbnailUrl: ''
    });
    playerStore.isPlaying = true;

    const wrapper = mount(TopResultCard, {
      props: { result },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { NuxtLink: NuxtLinkStub, NuxtImg: true, AppIcon: true, ClientOnly: true }
      }
    });

    expect(wrapper.find('.top-result-card__title').classes()).toContain('text-primary');
    expect(wrapper.find('.top-result-card__image-container').classes()).toContain(
      'top-result-card__image-container--active'
    );
  });
});
