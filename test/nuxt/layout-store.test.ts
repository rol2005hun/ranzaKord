import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLayoutStore } from '../../app/features/core/stores/useLayoutStore';

vi.mock('@tauri-apps/api/window', () => {
  return {
    getCurrentWindow: vi.fn(() => ({
      setAlwaysOnTop: vi.fn(),
      setSize: vi.fn(),
      setResizable: vi.fn()
    })),
    LogicalSize: vi.fn()
  };
});

describe('useLayoutStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1000
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default values', () => {
    const store = useLayoutStore();
    expect(store.isRightSidebarOpen).toBe(true);
    expect(store.rightSidebarMode).toBe('info');
    expect(store.isSettingsOpen).toBe(false);
    expect(store.visualizerStyle).toBe('circle');
    expect(store.isFullscreenVisualizer).toBe(false);
    expect(store.isMobileLyricsOpen).toBe(false);
    expect(store.isAddToPlaylistOpen).toBe(false);
    expect(store.isMiniPlayer).toBe(false);
  });

  it('toggles right sidebar', () => {
    const store = useLayoutStore();
    store.toggleRightSidebar();
    expect(store.isRightSidebarOpen).toBe(false);
    store.toggleRightSidebar();
    expect(store.isRightSidebarOpen).toBe(true);
  });

  it('opens and closes right sidebar', () => {
    const store = useLayoutStore();
    store.closeRightSidebar();
    expect(store.isRightSidebarOpen).toBe(false);

    store.openRightSidebar();
    expect(store.isRightSidebarOpen).toBe(true);

    store.openRightSidebar('lyrics');
    expect(store.rightSidebarMode).toBe('lyrics');
  });

  it('sets right sidebar mode', () => {
    const store = useLayoutStore();
    store.setRightSidebarMode('lyrics');
    expect(store.rightSidebarMode).toBe('lyrics');
  });

  it('sets right sidebar width within bounds', () => {
    const store = useLayoutStore();

    // Max width should be 1000 * 0.3 = 300
    // Min width is 220
    store.setRightSidebarWidth(250);
    expect(store.rightSidebarWidth).toBe(250);

    // Test min bound
    store.setRightSidebarWidth(100);
    expect(store.rightSidebarWidth).toBe(220);

    // Test max bound
    store.setRightSidebarWidth(500);
    expect(store.rightSidebarWidth).toBe(300);
  });

  it('toggles, opens, and closes settings', () => {
    const store = useLayoutStore();
    store.toggleSettings();
    expect(store.isSettingsOpen).toBe(true);
    store.closeSettings();
    expect(store.isSettingsOpen).toBe(false);
    store.openSettings();
    expect(store.isSettingsOpen).toBe(true);
  });

  it('sets visualizer style and toggles fullscreen', () => {
    const store = useLayoutStore();
    store.setVisualizerStyle('bars');
    expect(store.visualizerStyle).toBe('bars');

    store.toggleFullscreenVisualizer();
    expect(store.isFullscreenVisualizer).toBe(true);
  });

  it('toggles and closes mobile lyrics', () => {
    const store = useLayoutStore();
    store.toggleMobileLyrics();
    expect(store.isMobileLyricsOpen).toBe(true);
    store.closeMobileLyrics();
    expect(store.isMobileLyricsOpen).toBe(false);
  });

  it('toggles and closes add to playlist', () => {
    const store = useLayoutStore();
    store.toggleAddToPlaylist();
    expect(store.isAddToPlaylistOpen).toBe(true);
    store.closeAddToPlaylist();
    expect(store.isAddToPlaylistOpen).toBe(false);
  });

  it('toggles mini player', async () => {
    const store = useLayoutStore();
    // Assuming import.meta.client is true in vitest via nuxt-vitest environment
    await store.toggleMiniPlayer();
    expect(store.isMiniPlayer).toBe(true);

    await store.toggleMiniPlayer();
    expect(store.isMiniPlayer).toBe(false);
  });
});
