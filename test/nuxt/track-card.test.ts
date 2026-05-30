import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TrackCard from '../../app/features/search/components/TrackCard.vue';
import { usePlayerStore } from '../../app/features/player/stores/usePlayerStore';
import { usePlaylistsStore } from '../../app/features/playlists/stores/usePlaylistsStore';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string) => key
  });
});

describe('TrackCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mockTrack = {
    id: 'v1',
    title: 'Song Title',
    artist: 'Artist Name',
    thumbnailUrl: 'thumb.jpg',
    durationSeconds: 130,
    type: 'song' as const
  };

  it('renders track information correctly', () => {
    const wrapper = mount(TrackCard, {
      props: { track: mockTrack },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { AppIcon: true, AddToPlaylistPopup: true }
      }
    });

    expect(wrapper.text()).toContain('Song Title');
    expect(wrapper.text()).toContain('Artist Name');
    expect(wrapper.text()).toContain('2:10'); // 130 seconds
    const img = wrapper.find('.track-card__img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toContain('thumb.jpg');
  });

  it('handles missing thumbnail', () => {
    const trackNoThumb = { ...mockTrack, thumbnailUrl: '' };
    const wrapper = mount(TrackCard, {
      props: { track: trackNoThumb },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { AppIcon: true, AddToPlaylistPopup: true }
      }
    });

    expect(wrapper.find('.track-card__img').exists()).toBe(false);
    expect(wrapper.find('.track-card__img-placeholder').exists()).toBe(true);
  });

  it('emits play event on click', async () => {
    const wrapper = mount(TrackCard, {
      props: { track: mockTrack },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { AppIcon: true, AddToPlaylistPopup: true }
      }
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('play')?.[0]).toEqual([mockTrack]);

    await wrapper.find('.track-card__play-btn').trigger('click');
    expect(wrapper.emitted('play')?.[1]).toEqual([mockTrack]);
  });

  it('shows active state if current track', async () => {
    const playerStore = usePlayerStore();
    playerStore.setTrack({
      videoId: 'v1',
      title: '',
      artist: '',
      durationSeconds: 0,
      thumbnailUrl: ''
    });
    playerStore.isPlaying = true;

    const wrapper = mount(TrackCard, {
      props: { track: mockTrack },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { AppIcon: true, AddToPlaylistPopup: true }
      }
    });

    expect(wrapper.classes()).toContain('track-card--active');
    expect(wrapper.find('.track-card__playing-indicator').exists()).toBe(true);
  });

  it('toggles add to playlist popup', async () => {
    const playlistsStore = usePlaylistsStore();
    vi.spyOn(playlistsStore, 'isTrackInAnyPlaylist').mockReturnValue(true);

    const wrapper = mount(TrackCard, {
      props: { track: mockTrack },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { AppIcon: true, AddToPlaylistPopup: true }
      }
    });

    // Should show check mark since it's in a playlist
    const addBtn = wrapper.find('.track-card__add-btn');
    expect(addBtn.exists()).toBe(true);

    expect(wrapper.findComponent({ name: 'AddToPlaylistPopup' }).exists()).toBe(false);

    await addBtn.trigger('click');

    // Popup should show up
    expect(wrapper.findComponent({ name: 'AddToPlaylistPopup' }).exists()).toBe(true);

    // Test close emit
    await wrapper.findComponent({ name: 'AddToPlaylistPopup' }).vm.$emit('close');
    await nextTick();
    expect(wrapper.findComponent({ name: 'AddToPlaylistPopup' }).exists()).toBe(false);
  });
});
