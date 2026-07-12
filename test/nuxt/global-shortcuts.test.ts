import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGlobalShortcuts } from '../../app/features/player/composables/useGlobalShortcuts';
import { usePlayerStore } from '../../app/features/player/stores/usePlayerStore';
import { usePlayer } from '../../app/features/player/composables/usePlayer';

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    setAlwaysOnTop: vi.fn(),
    setSize: vi.fn(),
    setResizable: vi.fn()
  })),
  LogicalSize: vi.fn()
}));

const mockPlayer = {
  togglePlay: vi.fn(),
  next: vi.fn(),
  previous: vi.fn(),
  toggleMute: vi.fn()
};

vi.mock('../../app/features/player/composables/usePlayer', () => ({
  usePlayer: () => mockPlayer
}));

describe('useGlobalShortcuts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles shortcuts', async () => {
    const { registerShortcuts, cleanupShortcuts } = useGlobalShortcuts();
    const playerStore = usePlayerStore();

    playerStore.globalShortcutsEnabled = true;

    // Prevent real window addEventListener side effects from leaking
    const rmSpy = vi.spyOn(window, 'removeEventListener');

    await registerShortcuts();

    // Simulate space bar to play/pause
    const player = usePlayer();
    const playMock = vi.spyOn(player, 'togglePlay');
    const keyEventSpace = new KeyboardEvent('keydown', {
      code: 'Space',
      ctrlKey: true,
      altKey: true
    });
    window.dispatchEvent(keyEventSpace);
    expect(playMock).toHaveBeenCalled();

    cleanupShortcuts();
    expect(rmSpy).toHaveBeenCalled();
  });
});
