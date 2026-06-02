import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import PlaylistPage from '../../app/pages/playlist/[id].vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { ref } from 'vue';

const { mockFetchDetail, mockRemoveTrack, mockRemove, mockPlayQueue, mockNavigateTo } = vi.hoisted(
  () => ({
    mockFetchDetail: vi.fn(),
    mockRemoveTrack: vi.fn(),
    mockRemove: vi.fn(),
    mockPlayQueue: vi.fn(),
    mockNavigateTo: vi.fn()
  })
);

mockNuxtImport('usePlaylistsStore', () => {
  return () => ({
    fetchDetail: mockFetchDetail,
    removeTrack: mockRemoveTrack,
    remove: mockRemove
  });
});

mockNuxtImport('usePlayer', () => {
  return () => ({
    playQueue: mockPlayQueue,
    currentTrack: ref(null),
    isPlaying: ref(false),
    togglePlay: vi.fn()
  });
});

const mockRoute = { params: { id: 'p1' } };

mockNuxtImport('useRoute', () => () => mockRoute);
mockNuxtImport('navigateTo', () => mockNavigateTo);

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string, params: Record<string, unknown>) =>
      key + (params ? JSON.stringify(params) : '')
  });
});

mockNuxtImport('useAuth', () => {
  return () => ({
    fetchUser: vi.fn(),
    isAuthenticated: ref(false)
  });
});

const mockAsyncData = ref({
  id: 'p1',
  name: 'My Playlist',
  description: 'Desc',
  imageUrl: 'img.jpg',
  trackCount: 1,
  tracks: [
    { videoId: 't1', title: 'T1', artist: 'A1', artistId: 'a1', thumbnailUrl: '', durationMs: 1000 }
  ]
});
const mockStatus = ref('success');

mockNuxtImport('useAsyncData', () => {
  return async () => {
    // just return mocked data for test
    return { data: mockAsyncData, status: mockStatus };
  };
});

mockNuxtImport('useHead', () => vi.fn());
mockNuxtImport('definePageMeta', () => vi.fn());

describe('playlist/[id].vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStatus.value = 'success';
  });

  const mountPage = () => {
    return mount(
      {
        template: '<Suspense><PlaylistPage /></Suspense>',
        components: { PlaylistPage }
      },
      {
        global: {
          mocks: {
            $t: (k: string, p: Record<string, unknown>) => k + (p ? JSON.stringify(p) : '')
          },
          stubs: {
            AppMusicDetailView: {
              name: 'AppMusicDetailView',
              template: `
              <div class="mock-detail">
                <slot name="meta" />
                <slot name="actions" />
                <slot name="track-actions" :track="{ id: 't1' }" />
              </div>
            `
            },
            PlaylistModal: true,
            AppIcon: true,
            AppSpinner: true,
            ClientOnly: { template: '<div><slot/></div>' },
            Teleport: { template: '<div><slot/></div>' },
            Suspense: false
          }
        }
      }
    );
  };

  it('renders playlist details correctly', async () => {
    const wrapper = mountPage();
    // Wait for async setup
    await new Promise((r) => setTimeout(r, 0));

    expect(wrapper.text()).toContain('Desc');
    expect(wrapper.findComponent({ name: 'AppMusicDetailView' }).exists()).toBe(true);
  });

  it('handles play all', async () => {
    const wrapper = mountPage();
    await new Promise((r) => setTimeout(r, 0));

    wrapper.findComponent({ name: 'AppMusicDetailView' }).vm.$emit('play-all');
    expect(mockPlayQueue).toHaveBeenCalled();
  });

  it('handles track removal', async () => {
    const wrapper = mountPage();
    await new Promise((r) => setTimeout(r, 0));

    await wrapper.find('.playlist-page__track-remove').trigger('click');
    expect(mockRemoveTrack).toHaveBeenCalledWith('p1', 't1');
  });

  it('handles playlist deletion', async () => {
    mockRemove.mockResolvedValue(true);
    const wrapper = mountPage();
    await new Promise((r) => setTimeout(r, 0));

    // open modal
    await wrapper.find('.playlist-page__action-btn--danger').trigger('click');
    expect(wrapper.find('.playlist-page__confirm-dialog').exists()).toBe(true);

    // confirm delete
    await wrapper.find('.playlist-page__confirm-btn--danger').trigger('click');
    expect(mockRemove).toHaveBeenCalledWith('p1');

    // wait for promise
    await new Promise((r) => setTimeout(r, 0));
    expect(mockNavigateTo).toHaveBeenCalledWith('/');
  });
});
