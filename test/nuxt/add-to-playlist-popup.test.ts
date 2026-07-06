import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AddToPlaylistPopup from '../../app/features/playlists/components/AddToPlaylistPopup.vue';
import { usePlaylistsStore } from '../../app/features/playlists/stores/usePlaylistsStore';

import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string) => key
  });
});

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    onClickOutside: vi.fn(() => {
      // Mock simple mechanism: attach to window for tests
      // We don't really need to execute it here unless we trigger it manually
    })
  };
});

describe('AddToPlaylistPopup', () => {
  let anchor: HTMLElement;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    anchor = document.createElement('div');
    document.body.appendChild(anchor);

    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('innerHeight', 1000);
  });

  afterEach(() => {
    anchor.remove();
  });

  const mockTrack = {
    videoId: 'v1',
    title: 'T1',
    artist: 'A1',
    durationSeconds: 100,
    durationMs: 100000,
    thumbnailUrl: ''
  };

  it('renders correctly with no playlists', async () => {
    const store = usePlaylistsStore();
    store.playlists = [];

    const wrapper = mount(AddToPlaylistPopup, {
      props: {
        track: mockTrack,
        anchor
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: ['AppIcon', 'AppSpinner', 'Teleport']
      }
    });

    await nextTick();
    expect(wrapper.text()).toContain('playlists.noPlaylists');
  });

  it('renders playlists and handles add', async () => {
    const store = usePlaylistsStore();
    store.playlists = [
      {
        id: 'p1',
        name: 'My Playlist',
        description: '',
        imageUrl: '',
        trackCount: 0,
        trackIds: [],
        createdAt: '',
        updatedAt: ''
      }
    ];
    const addSpy = vi.spyOn(store, 'addTrack').mockResolvedValue();

    const wrapper = mount(AddToPlaylistPopup, {
      props: {
        track: mockTrack,
        anchor
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          AppIcon: true,
          AppSpinner: true,
          Teleport: { template: '<div><slot/></div>' }
        }
      }
    });

    await nextTick();

    const item = wrapper.find('.add-playlist-popup__name');
    expect(item.exists()).toBe(true);
    expect(item.text()).toBe('My Playlist');

    await wrapper.find('.add-playlist-popup__btn').trigger('click');
    expect(addSpy).toHaveBeenCalledWith('p1', mockTrack);
  });

  it('handles remove when track is already in playlist', async () => {
    const store = usePlaylistsStore();
    store.playlists = [
      {
        id: 'p1',
        name: 'My Playlist',
        description: '',
        imageUrl: '',
        trackCount: 1,
        trackIds: ['v1'],
        createdAt: '',
        updatedAt: ''
      }
    ];
    const removeSpy = vi.spyOn(store, 'removeTrack').mockResolvedValue();

    const wrapper = mount(AddToPlaylistPopup, {
      props: {
        track: mockTrack,
        anchor
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          AppIcon: true,
          AppSpinner: true,
          Teleport: { template: '<div><slot/></div>' }
        }
      }
    });

    await nextTick();
    await wrapper.find('.add-playlist-popup__btn').trigger('click');
    expect(removeSpy).toHaveBeenCalledWith('p1', 'v1');
  });

  it('emits close when close button clicked', async () => {
    const wrapper = mount(AddToPlaylistPopup, {
      props: { track: mockTrack, anchor: null },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { AppIcon: true, Teleport: { template: '<div><slot/></div>' } }
      }
    });

    await wrapper.find('.add-playlist-popup__close').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
