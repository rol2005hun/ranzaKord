import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';

import AppSkeleton from '@/components/shared/Skeleton.vue';
import AppTrackArtists from '@/components/shared/TrackArtists.vue';
import { useUpdaterStore } from '@/features/updater/stores/useUpdaterStore';

mockNuxtImport('useLocalePath', () => () => (path: string) => path);
mockNuxtImport('useAuth', () => () => ({
  isAuthenticated: ref(false),
  currentUser: ref(null),
  isTauri: ref(false)
}));
mockNuxtImport('useAppUpdate', () => () => ({
  updateInfo: ref({ available: false }),
  showUpdateModal: ref(false)
}));

describe('Skeleton', () => {
  it('renders with default props', async () => {
    const wrapper = await mountSuspended(AppSkeleton);
    const el = wrapper.find('.app-skeleton');
    expect(el.exists()).toBe(true);
    expect(el.attributes('style')).toContain('width: 100%');
    expect(el.attributes('style')).toContain('height: 100%');
  });

  it('applies custom width and height', async () => {
    const wrapper = await mountSuspended(AppSkeleton, {
      props: { width: '200px', height: '50px' }
    });
    const style = wrapper.find('.app-skeleton').attributes('style') ?? '';
    expect(style).toContain('width: 200px');
    expect(style).toContain('height: 50px');
  });

  it('applies circle mode with 50% border-radius', async () => {
    const wrapper = await mountSuspended(AppSkeleton, {
      props: { circle: true, width: '40px', height: '40px' }
    });
    const el = wrapper.find('.app-skeleton');
    expect(el.classes()).toContain('app-skeleton--circle');
    expect(el.attributes('style')).toContain('border-radius: 50%');
  });

  it('respects custom borderRadius when not circle', async () => {
    const wrapper = await mountSuspended(AppSkeleton, {
      props: { borderRadius: '8px' }
    });
    expect(wrapper.find('.app-skeleton').attributes('style')).toContain('border-radius: 8px');
  });
});

describe('TrackArtists', () => {
  it('renders a single artist string', async () => {
    const wrapper = await mountSuspended(AppTrackArtists, {
      props: { track: { artist: 'Test Artist' } }
    });
    expect(wrapper.text()).toContain('Test Artist');
  });

  it('renders multiple artists from artists array', async () => {
    const wrapper = await mountSuspended(AppTrackArtists, {
      props: {
        track: {
          artist: 'Fallback',
          artists: [
            { name: 'Artist One', id: '1' },
            { name: 'Artist Two', id: '2' }
          ]
        }
      }
    });
    expect(wrapper.text()).toContain('Artist One');
    expect(wrapper.text()).toContain('Artist Two');
  });

  it('renders nothing meaningful when track has no artist data', async () => {
    const wrapper = await mountSuspended(AppTrackArtists, {
      props: { track: {} }
    });
    const links = wrapper.findAll('a');
    expect(links.length).toBe(0);
  });
});

describe('useUpdaterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initialises with default values', () => {
    const store = useUpdaterStore();
    expect(store.info.available).toBe(false);
    expect(store.showModal).toBe(false);
    expect(store.hasChecked).toBe(false);
  });

  it('patch merges partial info', () => {
    const store = useUpdaterStore();
    store.patch({ available: true, version: '1.2.3' });
    expect(store.info.available).toBe(true);
    expect(store.info.version).toBe('1.2.3');
    expect(store.info.error).toBeNull();
  });

  it('dismiss hides modal when not mandatory', () => {
    const store = useUpdaterStore();
    store.patch({ available: true, isMandatory: false });
    store.showModal = true;
    store.dismiss();
    expect(store.info.available).toBe(true);
    expect(store.showModal).toBe(false);
  });

  it('dismiss does nothing when mandatory', () => {
    const store = useUpdaterStore();
    store.patch({ available: true, isMandatory: true });
    store.showModal = true;
    store.dismiss();
    expect(store.info.available).toBe(true);
    expect(store.showModal).toBe(true);
  });

  it('patch with externalDownloadUrl stores the url', () => {
    const store = useUpdaterStore();
    store.patch({ externalDownloadUrl: 'https://example.com/app.apk' });
    expect(store.info.externalDownloadUrl).toBe('https://example.com/app.apk');
  });
});
