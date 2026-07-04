import type { Track, CrossfadeType, PlaybackContext } from '../types/player.types';

export const usePlayerStore = defineStore(
  'player',
  () => {
    const currentTrack = ref<Track | null>(null);
    const queue = shallowRef<Track[]>([]);
    const playHistory = shallowRef<Track[]>([]);
    const isPlaying = ref(false);
    const volume = ref(0.8);
    const currentTimeSeconds = ref(0);

    if (import.meta.client) {
      currentTimeSeconds.value = Number(localStorage.getItem('player_currentTimeSeconds')) || 0;

      watchThrottled(
        currentTimeSeconds,
        (val) => {
          localStorage.setItem('player_currentTimeSeconds', String(val));
        },
        { throttle: 5000 }
      );
    }
    const durationSeconds = ref(0);
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const playbackOrder = ref<'sequential' | 'random' | 'reverse'>('sequential');
    const repeatMode = ref<'off' | 'all' | 'one'>('off');
    const crossfadeEnabled = ref(false);
    const crossfadeDuration = ref(5);
    const crossfadeType = ref<CrossfadeType>('dj');
    const isKaraoke = ref(false);
    const isSpatialAudio = ref(false);
    const isAudioReactiveLyrics = ref(true);
    const eqEnabled = ref(false);
    const eqPreset = ref('flat');
    const eqBands = ref<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    const playbackContext = ref<PlaybackContext | null>(null);
    const autoplayEnabled = ref(false);
    const globalShortcutsEnabled = ref(true);

    const hasNext = computed(() => {
      const track = currentTrack.value;
      if (!track) return false;
      if (playbackOrder.value === 'random') return queue.value.length > 1;
      if (repeatMode.value === 'all') return queue.value.length > 0;
      const idx = queue.value.findIndex(
        (t) => (track.queueId && t.queueId === track.queueId) || t.videoId === track.videoId
      );
      if (idx === -1) return false;
      if (playbackOrder.value === 'reverse') return idx > 0;
      return idx < queue.value.length - 1;
    });

    const hasPrev = computed(() => {
      const track = currentTrack.value;
      if (!track) return false;
      if (playHistory.value.length > 0) return true;
      if (playbackOrder.value === 'random') return false;
      if (repeatMode.value === 'all') return queue.value.length > 0;
      const idx = queue.value.findIndex(
        (t) => (track.queueId && t.queueId === track.queueId) || t.videoId === track.videoId
      );
      if (idx === -1) return false;
      if (playbackOrder.value === 'reverse') return idx < queue.value.length - 1;
      return idx > 0;
    });

    function setTrack(track: Track, fromHistory = false) {
      if (currentTrack.value && !fromHistory) {
        const newHistory = [...playHistory.value, currentTrack.value];
        if (newHistory.length > 50) newHistory.shift();
        playHistory.value = newHistory;
      }
      currentTrack.value = track;
      currentTimeSeconds.value = 0;
      durationSeconds.value = track.durationSeconds;
      error.value = null;
    }

    function setQueue(tracks: Track[]) {
      queue.value = tracks.slice(0, 100).map((t) => ({
        ...t,
        queueId: t.queueId || crypto.randomUUID()
      }));
    }

    function addToQueue(track: Track) {
      const newQueue = [...queue.value];
      newQueue.push({
        ...track,
        queueId: track.queueId || crypto.randomUUID()
      });
      if (newQueue.length > 100) {
        newQueue.shift();
      }
      queue.value = newQueue;
    }

    function reorderQueue(fromIndex: number, toIndex: number) {
      if (fromIndex < 0 || fromIndex >= queue.value.length) return;
      if (toIndex < 0 || toIndex >= queue.value.length) return;
      const newQueue = [...queue.value];
      const item = newQueue.splice(fromIndex, 1)[0];
      if (item) {
        newQueue.splice(toIndex, 0, item);
        queue.value = newQueue;
      }
    }

    function removeFromQueue(index: number) {
      if (index >= 0 && index < queue.value.length) {
        const newQueue = [...queue.value];
        newQueue.splice(index, 1);
        queue.value = newQueue;
      }
    }

    function clearQueue() {
      queue.value = [];
    }

    function nextTrack(): Track | null {
      const track = currentTrack.value;
      if (!track) return null;
      if (queue.value.length === 0) return null;

      if (playbackOrder.value === 'random') {
        const others = queue.value.filter((t) =>
          track.queueId ? t.queueId !== track.queueId : t.videoId !== track.videoId
        );
        if (others.length === 0) return track;
        const randomIdx = Math.floor(Math.random() * others.length);
        return others[randomIdx] ?? null;
      }

      const idx = queue.value.findIndex(
        (t) => (track.queueId && t.queueId === track.queueId) || t.videoId === track.videoId
      );

      if (playbackOrder.value === 'reverse') {
        if (idx > 0) return queue.value[idx - 1] ?? null;
        if (repeatMode.value === 'all') return queue.value[queue.value.length - 1] ?? null;
        return null;
      }

      if (idx >= 0 && idx < queue.value.length - 1) {
        return queue.value[idx + 1] ?? null;
      }

      if (repeatMode.value === 'all') {
        return queue.value[0] ?? null;
      }

      return null;
    }

    function prevTrack(): Track | null {
      if (playHistory.value.length > 0) {
        const newHistory = [...playHistory.value];
        const prev = newHistory.pop();
        playHistory.value = newHistory;
        return prev ?? null;
      }
      const track = currentTrack.value;
      if (!track) return null;
      if (queue.value.length === 0) return null;

      if (playbackOrder.value === 'random') return null;

      const idx = queue.value.findIndex(
        (t) => (track.queueId && t.queueId === track.queueId) || t.videoId === track.videoId
      );

      if (playbackOrder.value === 'reverse') {
        if (idx >= 0 && idx < queue.value.length - 1) return queue.value[idx + 1] ?? null;
        if (repeatMode.value === 'all') return queue.value[0] ?? null;
        return null;
      }

      if (idx > 0) {
        return queue.value[idx - 1] ?? null;
      }

      if (repeatMode.value === 'all') {
        return queue.value[queue.value.length - 1] ?? null;
      }

      return null;
    }

    let lastStartTimestamp = 0;
    let lastTrackId = '';
    let lastIsPlaying = false;

    const doSyncDiscord = async () => {
      if (!import.meta.client) return;
      try {
        const { isTauri, invoke } = await import('@tauri-apps/api/core');
        if (isTauri()) {
          if (isPlaying.value && currentTrack.value) {
            // Add 1 second to startTimestamp so Discord always appears slightly delayed, never ahead.
            const startTimestamp = Math.round(Date.now() / 1000 - currentTimeSeconds.value) + 1;

            const isSameTrack = lastTrackId === currentTrack.value.videoId;
            const isSamePlaying = lastIsPlaying === isPlaying.value;
            const drift = Math.abs(startTimestamp - lastStartTimestamp);

            // Only update if state changed, track changed, or time drifted by > 2 seconds
            if (isSameTrack && isSamePlaying && drift <= 2) {
              return;
            }

            lastStartTimestamp = startTimestamp;
            lastTrackId = currentTrack.value.videoId;
            lastIsPlaying = isPlaying.value;

            const endTimestamp =
              currentTrack.value.durationSeconds > 0
                ? Math.round(startTimestamp + currentTrack.value.durationSeconds)
                : null;

            const config = useRuntimeConfig();
            const baseUrl = config.public.baseUrl;
            const buttonUrl = `${baseUrl}/?play=${currentTrack.value.videoId}`;

            await invoke('set_discord_presence', {
              details: currentTrack.value.title,
              stateStr: currentTrack.value.artist,
              largeImage: currentTrack.value.thumbnailUrl,
              buttonUrl: buttonUrl,
              startTimestamp,
              endTimestamp
            });
          } else {
            if (lastIsPlaying !== false) {
              await invoke('clear_discord_presence');
              lastIsPlaying = false;
            }
          }
        }
      } catch {
        // Ignore Discord RPC errors (e.g. not supported on mobile)
      }
    };

    const syncDiscordPresence = useThrottleFn(doSyncDiscord, 2000);

    if (import.meta.client) {
      window.addEventListener('beforeunload', () => {
        const authStore = useAuthStore();
        if (authStore.isAuthenticated && currentTrack.value) {
          localStorage.setItem('player_currentTimeSeconds', String(currentTimeSeconds.value));
          fetch('/api/player/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoId: currentTrack.value.videoId,
              currentTime: currentTimeSeconds.value
            }),
            keepalive: true
          }).catch(() => {});
        }

        // Clear Discord RPC synchronously on unload
        if (typeof window !== 'undefined') {
          const tauriWindow = window as unknown as {
            __TAURI_INTERNALS__?: {
              invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
            };
          };
          if (tauriWindow.__TAURI_INTERNALS__) {
            tauriWindow.__TAURI_INTERNALS__.invoke('clear_discord_presence').catch(() => {});
          }
        }
      });

      watch([isPlaying, currentTrack], () => {
        syncDiscordPresence();
      });

      useIntervalFn(() => {
        if (isPlaying.value) {
          syncDiscordPresence();
        }
      }, 2000);
    }

    return {
      currentTrack,
      queue,
      isPlaying,
      volume,
      currentTimeSeconds,
      durationSeconds,
      isLoading,
      error,
      playbackOrder,
      repeatMode,
      hasNext,
      hasPrev,
      crossfadeEnabled,
      crossfadeDuration,
      crossfadeType,
      setTrack,
      setQueue,
      addToQueue,
      reorderQueue,
      removeFromQueue,
      clearQueue,
      nextTrack,
      prevTrack,
      syncDiscordPresence,
      isKaraoke,
      isSpatialAudio,
      isAudioReactiveLyrics,
      eqEnabled,
      eqPreset,
      eqBands,
      playbackContext,
      autoplayEnabled,
      globalShortcutsEnabled
    };
  },
  {
    persist: [
      {
        pick: [
          'currentTrack',
          'volume',
          'durationSeconds',
          'playbackOrder',
          'playHistory',
          'repeatMode',
          'queue',
          'isPlaying',
          'crossfadeEnabled',
          'crossfadeDuration',
          'crossfadeType',
          'isKaraoke',
          'isSpatialAudio',
          'isAudioReactiveLyrics',
          'eqEnabled',
          'eqPreset',
          'eqBands',
          'playbackContext',
          'autoplayEnabled',
          'globalShortcutsEnabled'
        ],
        storage: piniaPluginPersistedstate.localStorage()
      }
    ]
  }
);
