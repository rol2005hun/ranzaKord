import { register, unregisterAll, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { usePlayerStore } from '../stores/usePlayerStore';
import { usePlayer } from './usePlayer';
import { isTauri } from '@tauri-apps/api/core';

export function useGlobalShortcuts() {
  const playerStore = usePlayerStore();
  const player = usePlayer();

  const SHORTCUTS = {
    PLAY_PAUSE: 'CommandOrControl+Alt+Space',
    NEXT: 'CommandOrControl+Alt+Right',
    PREVIOUS: 'CommandOrControl+Alt+Left'
  };

  async function registerShortcuts() {
    if (!import.meta.client) return;
    try {
      if (!(await isTauri())) return;

      await unregisterAll();

      if (!playerStore.globalShortcutsEnabled) return;

      const playPauseRegistered = await isRegistered(SHORTCUTS.PLAY_PAUSE);
      if (!playPauseRegistered) {
        await register(SHORTCUTS.PLAY_PAUSE, () => {
          player.togglePlay();
        });
      }

      const nextRegistered = await isRegistered(SHORTCUTS.NEXT);
      if (!nextRegistered) {
        await register(SHORTCUTS.NEXT, () => {
          player.playNext();
        });
      }

      const prevRegistered = await isRegistered(SHORTCUTS.PREVIOUS);
      if (!prevRegistered) {
        await register(SHORTCUTS.PREVIOUS, () => {
          player.playPrev();
        });
      }
    } catch (error) {
      console.error('Failed to register global shortcuts:', error);
    }
  }

  async function cleanupShortcuts() {
    if (!import.meta.client) return;
    try {
      if (await isTauri()) {
        await unregisterAll();
      }
    } catch (error) {
      console.error('Failed to unregister global shortcuts:', error);
    }
  }

  onMounted(() => {
    registerShortcuts();
  });

  onBeforeUnmount(() => {
    cleanupShortcuts();
  });

  watch(
    () => playerStore.globalShortcutsEnabled,
    () => {
      registerShortcuts();
    }
  );

  return {
    registerShortcuts,
    cleanupShortcuts
  };
}
