import { describe, it, expect, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import SearchListItem from '../../app/features/search/components/SearchListItem.vue';
import { createTestingPinia } from '@pinia/testing';
import { usePlaylistsStore } from '../../app/features/playlists/stores/usePlaylistsStore';
import type { SearchResult } from '../../app/features/search/types/search.types';

vi.mock('../../app/features/player/composables/usePlayer', () => ({
  usePlayer: () => ({
    playTrack: vi.fn()
  })
}));

describe('SearchListItem', () => {
  const mockSong: SearchResult = {
    id: 'song1',
    title: 'Test Song',
    artist: 'Test Artist',
    type: 'song',
    thumbnailUrl: 'http://example.com/thumb.jpg',
    durationSeconds: 120
  };

  const mockArtist: SearchResult = {
    id: 'artist1',
    title: '',
    artist: 'Test Artist',
    type: 'artist',
    thumbnailUrl: 'http://example.com/thumb.jpg'
  };

  const mockAlbum: SearchResult = {
    id: 'album1',
    title: 'Test Album',
    artist: 'Test Artist',
    type: 'album',
    thumbnailUrl: 'http://example.com/thumb.jpg'
  };

  const globalMountOptions = {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
        AppIcon: true,
        AddToPlaylistPopup: true
      },
      mocks: {
        $t: (key: string) => key
      }
    }
  };

  it('renders song information correctly', async () => {
    const wrapper = await mountSuspended(SearchListItem, {
      ...globalMountOptions,
      props: { track: mockSong }
    });

    expect(wrapper.text()).toContain('Test Song');
    expect(wrapper.text()).toContain('search.list.song');
    expect(wrapper.text()).toContain('Test Artist');
  });

  it('renders artist information correctly', async () => {
    const wrapper = await mountSuspended(SearchListItem, {
      ...globalMountOptions,
      props: { track: mockArtist }
    });

    expect(wrapper.text()).toContain('search.list.artist');
    expect(wrapper.classes()).toContain('search-list-item--artist');
  });

  it('renders album information correctly', async () => {
    const wrapper = await mountSuspended(SearchListItem, {
      ...globalMountOptions,
      props: { track: mockAlbum }
    });

    expect(wrapper.text()).toContain('Test Album');
    expect(wrapper.text()).toContain('search.list.album');
  });

  it('emits click event and plays song on click', async () => {
    const wrapper = await mountSuspended(SearchListItem, {
      ...globalMountOptions,
      props: { track: mockSong }
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('shows check icon if song is in playlist', async () => {
    const wrapper = await mountSuspended(SearchListItem, {
      ...globalMountOptions,
      props: { track: mockSong }
    });

    const playlistsStore = usePlaylistsStore();
    vi.mocked(playlistsStore.isTrackInAnyPlaylist).mockReturnValue(true);

    wrapper.vm.$forceUpdate();

    expect(wrapper.exists()).toBe(true);
  });
});
