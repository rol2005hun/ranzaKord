import type { Track, CrossfadeType } from '../types/player.types';

export const usePlayerStore = defineStore(
  'player',
  () => {
    const currentTrack = ref<Track | null>(null);
    const queue = ref<Track[]>([]);
    const playHistory = ref<Track[]>([]);
    const isPlaying = ref(false);
    const volume = ref(0.8);
    const currentTimeSeconds = ref(0);
    const durationSeconds = ref(0);
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const playbackOrder = ref<'sequential' | 'random' | 'reverse'>('sequential');
    const repeatMode = ref<'off' | 'all' | 'one'>('off');
    const crossfadeEnabled = ref(false);
    const crossfadeDuration = ref(5);
    const crossfadeType = ref<CrossfadeType>('dj');
    const isKaraoke = ref(false);
    const isAudioReactiveLyrics = ref(true);
    const eqEnabled = ref(false);
    const eqPreset = ref('flat');
    const eqBands = ref<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    const hasNext = computed(() => {
      const track = currentTrack.value;
      if (!track) return false;
      if (playbackOrder.value === 'random') return queue.value.length > 1;
      if (repeatMode.value === 'all') return queue.value.length > 0;
      const idx = queue.value.findIndex((t) => t.videoId === track.videoId);
      return idx >= 0 && idx < queue.value.length - 1;
    });

    const hasPrev = computed(() => {
      const track = currentTrack.value;
      if (!track) return false;
      if (playHistory.value.length > 0) return true;
      if (playbackOrder.value === 'random') return false;
      if (repeatMode.value === 'all') return queue.value.length > 0;
      const idx = queue.value.findIndex((t) => t.videoId === track.videoId);
      return idx > 0;
    });

    function setTrack(track: Track, fromHistory = false) {
      if (currentTrack.value && !fromHistory) {
        playHistory.value.push(currentTrack.value);
        if (playHistory.value.length > 50) playHistory.value.shift();
      }
      currentTrack.value = track;
      currentTimeSeconds.value = 0;
      durationSeconds.value = track.durationSeconds;
      error.value = null;
    }

    function setQueue(tracks: Track[]) {
      queue.value = tracks;
    }

    function addToQueue(track: Track) {
      if (!queue.value.find((t) => t.videoId === track.videoId)) {
        queue.value.push(track);
      }
    }

    function reorderQueue(fromIndex: number, toIndex: number) {
      if (fromIndex < 0 || fromIndex >= queue.value.length) return;
      if (toIndex < 0 || toIndex >= queue.value.length) return;
      const item = queue.value.splice(fromIndex, 1)[0];
      if (item) {
        queue.value.splice(toIndex, 0, item);
      }
    }

    function removeFromQueue(index: number) {
      if (index >= 0 && index < queue.value.length) {
        queue.value.splice(index, 1);
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
        const others = queue.value.filter((t) => t.videoId !== track.videoId);
        if (others.length === 0) return track;
        const randomIdx = Math.floor(Math.random() * others.length);
        return others[randomIdx] ?? null;
      }

      const idx = queue.value.findIndex((t) => t.videoId === track.videoId);

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
        const prev = playHistory.value.pop();
        return prev ?? null;
      }
      const track = currentTrack.value;
      if (!track) return null;
      if (queue.value.length === 0) return null;

      if (playbackOrder.value === 'random') return null;

      const idx = queue.value.findIndex((t) => t.videoId === track.videoId);
      if (idx > 0) {
        return queue.value[idx - 1] ?? null;
      }

      if (repeatMode.value === 'all') {
        return queue.value[queue.value.length - 1] ?? null;
      }

      return null;
    }

    const syncDiscordPresence = useDebounceFn(
      async () => {
        if (!import.meta.client) return;
        try {
          const { isTauri, invoke } = await import('@tauri-apps/api/core');
          if (isTauri()) {
            if (isPlaying.value && currentTrack.value) {
              const startTimestamp =
                Math.floor(Date.now() / 1000) - Math.floor(currentTimeSeconds.value);
              const endTimestamp =
                currentTrack.value.durationSeconds > 0
                  ? startTimestamp + currentTrack.value.durationSeconds
                  : null;
              await invoke('set_discord_presence', {
                details: currentTrack.value.title,
                stateStr: currentTrack.value.artist,
                largeImage: currentTrack.value.thumbnailUrl,
                trackId: currentTrack.value.videoId,
                startTimestamp,
                endTimestamp
              });
            } else {
              await invoke('clear_discord_presence');
            }
          }
        } catch (e) {
          console.error('Discord RPC error:', e);
        }
      },
      500,
      { maxWait: 5000 }
    );

    if (import.meta.client) {
      window.addEventListener('beforeunload', () => {
        if (currentTrack.value) {
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
      });

      watch([isPlaying, currentTrack], () => {
        syncDiscordPresence();
      });
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
      isAudioReactiveLyrics,
      eqEnabled,
      eqPreset,
      eqBands
    };
  },
  {
    persist: [
      {
        pick: [
          'currentTrack',
          'volume',
          'currentTimeSeconds',
          'durationSeconds',
          'isShuffle',
          'repeatMode',
          'queue',
          'isPlaying',
          'crossfadeEnabled',
          'crossfadeDuration',
          'crossfadeType',
          'isKaraoke',
          'isAudioReactiveLyrics',
          'eqEnabled',
          'eqPreset',
          'eqBands'
        ],
        storage: piniaPluginPersistedstate.localStorage()
      }
    ]
  }
);
