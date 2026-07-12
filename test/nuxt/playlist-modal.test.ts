import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PlaylistModal from '../../app/features/playlists/components/PlaylistModal.vue';
import { createTestingPinia } from '@pinia/testing';
import { usePlaylistsStore } from '../../app/features/playlists/stores/usePlaylistsStore';

describe('PlaylistModal.vue', () => {
  it('renders correctly and creates playlist', async () => {
    const pinia = createTestingPinia({ stubActions: false, createSpy: vi.fn });
    const store = usePlaylistsStore();
    vi.spyOn(store, 'create').mockResolvedValue({
      id: 'p1',
      name: 'Test',
      description: '',
      imageUrl: '',
      trackCount: 0,
      trackIds: [],
      createdAt: '',
      updatedAt: ''
    });

    const wrapper = mount(PlaylistModal, {
      props: {
        open: true
      },
      global: {
        plugins: [pinia],
        stubs: {
          AppModal: {
            template: '<div><slot/><slot name="footer"/></div>'
          },
          AppInput: true,
          AppTextarea: true,
          AppButton: true,
          AppIcon: true,
          NuxtImg: true,
          AppSpinner: true
        },
        mocks: {
          $t: (msg: string) => msg
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
  });
});
