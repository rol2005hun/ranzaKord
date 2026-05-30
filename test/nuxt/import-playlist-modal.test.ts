import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ImportPlaylistModal from '../../app/features/playlists/components/ImportPlaylistModal.vue';
import { usePlaylistsStore } from '../../app/features/playlists/stores/usePlaylistsStore';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { mockNuxtImport } from '@nuxt/test-utils/runtime';

mockNuxtImport('useI18n', () => {
  return () => ({
    t: (key: string) => key
  });
});

describe('ImportPlaylistModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mountModal = (open = true) => {
    return mount(ImportPlaylistModal, {
      props: { open },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: {
          AppModal: { template: '<div><slot/></div>' },
          AppSpinner: true
        }
      }
    });
  };

  it('renders correctly', () => {
    const wrapper = mountModal();
    expect(wrapper.find('input[type="url"]').exists()).toBe(true);
    expect(wrapper.find('.import-modal__button--primary').exists()).toBe(true);
    expect(wrapper.find('.import-modal__button--secondary').exists()).toBe(true);
  });

  it('validates url correctly', async () => {
    const wrapper = mountModal();
    const input = wrapper.find('input[type="url"]');
    const primaryBtn = wrapper.find('.import-modal__button--primary');

    // Initially invalid
    expect((primaryBtn.element as HTMLButtonElement).disabled).toBe(true);

    // Invalid url string
    await input.setValue('not a url');
    expect((primaryBtn.element as HTMLButtonElement).disabled).toBe(true);
    expect(wrapper.find('.import-modal__hint').exists()).toBe(true);

    // Invalid domain
    await input.setValue('https://google.com/playlist');
    expect((primaryBtn.element as HTMLButtonElement).disabled).toBe(true);

    // Valid YouTube
    await input.setValue('https://youtube.com/playlist?list=123');
    expect((primaryBtn.element as HTMLButtonElement).disabled).toBe(false);
    expect(wrapper.find('.import-modal__hint').exists()).toBe(false);

    // Valid Spotify
    await input.setValue('https://open.spotify.com/playlist/123');
    expect((primaryBtn.element as HTMLButtonElement).disabled).toBe(false);
  });

  it('handles import correctly', async () => {
    const store = usePlaylistsStore();
    const importSpy = vi.spyOn(store, 'importPlaylist').mockResolvedValue({
      id: 'new-id',
      name: 'Test',
      description: '',
      imageUrl: '',
      trackCount: 0,
      trackIds: [],
      createdAt: '',
      updatedAt: ''
    });

    const wrapper = mountModal();
    const input = wrapper.find('input[type="url"]');

    await input.setValue('https://youtube.com/playlist?list=123');

    const primaryBtn = wrapper.find('.import-modal__button--primary');
    await primaryBtn.trigger('click');

    expect(importSpy).toHaveBeenCalledWith('https://youtube.com/playlist?list=123', 'youtube');

    await nextTick();
    expect(wrapper.emitted('imported')?.[0]).toEqual(['new-id']);
  });

  it('emits close when cancel clicked', async () => {
    const wrapper = mountModal();
    await wrapper.find('.import-modal__button--secondary').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
