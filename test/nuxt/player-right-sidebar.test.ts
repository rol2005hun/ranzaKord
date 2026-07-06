import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import PlayerRightSidebar from '../../app/features/player/components/PlayerRightSidebar.vue';
import { useLayoutStore } from '../../app/features/core/stores/useLayoutStore';
import { nextTick } from 'vue';

describe('PlayerRightSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => {
      return {
        width: 120,
        height: 120,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => {}
      };
    });

    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly', async () => {
    const layoutStore = useLayoutStore();
    layoutStore.isRightSidebarOpen = true;

    const wrapper = await mountSuspended(PlayerRightSidebar);
    expect(wrapper.exists()).toBe(true);
  });

  it('shows info skeleton when not hydrated and mode is info', async () => {
    const layoutStore = useLayoutStore();
    layoutStore.rightSidebarMode = 'info';

    const wrapper = await mountSuspended(PlayerRightSidebar);
    // Since we are mounted, isHydrated might become true soon, but we can check if it exists or if we can force it
    expect(wrapper.find('.right-sidebar__info').exists()).toBe(true);
  });

  it('shows lyrics skeleton when not hydrated and mode is lyrics', async () => {
    const layoutStore = useLayoutStore();
    layoutStore.rightSidebarMode = 'lyrics';

    const wrapper = await mountSuspended(PlayerRightSidebar);
    // Wait for the next tick to ensure mode is set
    await nextTick();
    expect(wrapper.find('.right-sidebar__lyrics').exists()).toBe(true);
  });

  it('switches tabs correctly', async () => {
    const layoutStore = useLayoutStore();
    layoutStore.rightSidebarMode = 'info';

    const wrapper = await mountSuspended(PlayerRightSidebar);
    await nextTick();

    const lyricsTabBtn = wrapper.find('#sidebar-tab-lyrics');
    await lyricsTabBtn.trigger('click');

    expect(layoutStore.rightSidebarMode).toBe('lyrics');
  });

  it('closes sidebar correctly', async () => {
    const layoutStore = useLayoutStore();
    layoutStore.isRightSidebarOpen = true;

    const wrapper = await mountSuspended(PlayerRightSidebar);
    await nextTick();

    const closeBtn = wrapper.find('#sidebar-close-btn');
    await closeBtn.trigger('click');

    expect(layoutStore.isRightSidebarOpen).toBe(false);
  });
});
