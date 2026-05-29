import { defineComponent, h, nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';

import ImportPlaylistModal from '@/features/playlists/components/ImportPlaylistModal.vue';
import { usePlaylistsStore } from '@/features/playlists/stores/usePlaylistsStore';

import type { PlaylistSummary } from '@/features/playlists/types/playlists.types';

function createPlaylistSummary(overrides: Partial<PlaylistSummary> = {}): PlaylistSummary {
  return {
    id: 'playlist-1',
    name: 'My Playlist',
    description: '',
    imageUrl: '',
    trackCount: 0,
    trackIds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

async function mountPlaylistStore() {
  let store: ReturnType<typeof usePlaylistsStore> | undefined;

  const Harness = defineComponent({
    setup() {
      store = usePlaylistsStore();
      return () => h('div');
    }
  });

  await mountSuspended(Harness);

  if (!store) {
    throw new Error('Playlist store was not initialized');
  }

  store.playlists = [];
  store.isLoading = true;
  store.error = null;
  store.importProgress = null;

  return store;
}

describe('ImportPlaylistModal', () => {
  it('validates the URL and calls importPlaylist for a Spotify playlist', async () => {
    const store = await mountPlaylistStore();
    const importPlaylist = vi
      .spyOn(store, 'importPlaylist')
      .mockResolvedValue(createPlaylistSummary({ id: 'imported-playlist' }));

    const wrapper = await mountSuspended(ImportPlaylistModal, {
      props: { open: true },
      global: { stubs: { Teleport: true } }
    });

    const input = wrapper.find('input[type="url"]');
    await input.setValue('not-a-valid-url');

    expect(wrapper.text()).toContain('Please enter a valid Spotify or YouTube playlist URL.');
    expect(
      wrapper.find('button.import-modal__button--primary').attributes('disabled')
    ).toBeDefined();

    await input.setValue('https://open.spotify.com/playlist/abc123');

    const primaryButton = wrapper.find('button.import-modal__button--primary');
    expect(primaryButton.attributes('disabled')).toBeUndefined();

    await primaryButton.trigger('click');

    expect(importPlaylist).toHaveBeenCalledWith(
      'https://open.spotify.com/playlist/abc123',
      'spotify'
    );
    expect(wrapper.emitted('imported')?.[0]).toEqual(['imported-playlist']);
    expect((input.element as HTMLInputElement).value).toBe('');
  });

  it('shows import progress when the store is importing', async () => {
    const store = await mountPlaylistStore();
    let resolveImport: (value: PlaylistSummary | null) => void = () => undefined;
    const importPromise = new Promise<PlaylistSummary | null>((resolve) => {
      resolveImport = resolve;
    });
    vi.spyOn(store, 'importPlaylist').mockReturnValue(importPromise);

    const wrapper = await mountSuspended(ImportPlaylistModal, {
      props: { open: true },
      global: { stubs: { Teleport: true } }
    });

    const input = wrapper.find('input[type="url"]');
    await input.setValue('https://www.youtube.com/playlist?list=PL123');

    const primaryButton = wrapper.find('button.import-modal__button--primary');
    await primaryButton.trigger('click');
    store.importProgress = { current: 2, total: 5 };
    await nextTick();

    expect(wrapper.text()).toContain('Importing');
    expect(wrapper.text()).toContain('2/5');

    resolveImport(createPlaylistSummary({ id: 'imported-youtube' }));
    await flushPromises();

    expect(wrapper.emitted('imported')?.[0]).toEqual(['imported-youtube']);
  });
});

describe('usePlaylistsStore', () => {
  it('checks track membership and mutates track state', async () => {
    const store = await mountPlaylistStore();
    store.playlists = [
      createPlaylistSummary({
        id: 'playlist-1',
        trackCount: 1,
        trackIds: ['video-1']
      }),
      createPlaylistSummary({
        id: 'playlist-2',
        trackCount: 0,
        trackIds: []
      })
    ];

    const fetchMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('$fetch', fetchMock);

    expect(store.isTrackInPlaylist('playlist-1', 'video-1')).toBe(true);
    expect(store.isTrackInPlaylist('playlist-2', 'video-1')).toBe(false);
    expect(store.isTrackInAnyPlaylist('video-1')).toBe(true);
    expect(store.isTrackInAnyPlaylist('missing-video')).toBe(false);

    await store.addTrack('playlist-2', {
      videoId: 'video-2',
      title: 'Track 2',
      artist: 'Artist 2',
      thumbnailUrl: 'thumb.jpg',
      durationMs: 120000
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/playlists/playlist-2/tracks', {
      method: 'POST',
      body: {
        videoId: 'video-2',
        title: 'Track 2',
        artist: 'Artist 2',
        thumbnailUrl: 'thumb.jpg',
        durationMs: 120000
      }
    });
    expect(store.playlists[1]?.trackCount).toBe(1);
    expect(store.playlists[1]?.trackIds).toContain('video-2');

    await store.removeTrack('playlist-1', 'video-1');

    expect(fetchMock).toHaveBeenCalledWith('/api/playlists/playlist-1/tracks/video-1', {
      method: 'DELETE'
    });
    expect(store.playlists[0]?.trackCount).toBe(0);
    expect(store.playlists[0]?.trackIds).toEqual([]);
  });
});
