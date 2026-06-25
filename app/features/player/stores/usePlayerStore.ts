import type { Track } from '../types/player.types';

export const usePlayerStore = defineStore(
  'player',
  () => {
    const currentTrack = ref<Track | null>(null);
    const queue = ref<Track[]>([]);
    const isPlaying = ref(false);
    const volume = ref(0.8);
    const currentTimeSeconds = ref(0);
    const durationSeconds = ref(0);
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const isShuffle = ref(false);
    const repeatMode = ref<'off' | 'all' | 'one'>('off');
    const crossfadeEnabled = ref(false);
    const crossfadeDuration = ref(5);
    const isKaraoke = ref(false);
    const isAudioReactiveLyrics = ref(true);

    const hasNext = computed(() => {
      const track = currentTrack.value;
      if (!track) return false;
      if (isShuffle.value) return queue.value.length > 1;
      if (repeatMode.value === 'all') return queue.value.length > 0;
      const idx = queue.value.findIndex((t) => t.videoId === track.videoId);
      return idx >= 0 && idx < queue.value.length - 1;
    });

    const hasPrev = computed(() => {
      const track = currentTrack.value;
      if (!track) return false;
      if (isShuffle.value) return queue.value.length > 1;
      if (repeatMode.value === 'all') return queue.value.length > 0;
      const idx = queue.value.findIndex((t) => t.videoId === track.videoId);
      return idx > 0;
    });

    function setTrack(track: Track) {
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

    function nextTrack(): Track | null {
      const track = currentTrack.value;
      if (!track) return null;
      if (queue.value.length === 0) return null;

      if (isShuffle.value) {
        const others = queue.value.filter((t) => t.videoId !== track.videoId);
        if (others.length === 0) return track;
        const randomIdx = Math.floor(Math.random() * others.length);
        return others[randomIdx] ?? null;
      }

      const idx = queue.value.findIndex((t) => t.videoId === track.videoId);
      if (idx >= 0 && idx < queue.value.length - 1) {
        return queue.value[idx + 1] ?? null;
      }

      if (repeatMode.value === 'all') {
        return queue.value[0] ?? null;
      }

      return null;
    }

    function prevTrack(): Track | null {
      const track = currentTrack.value;
      if (!track) return null;
      if (queue.value.length === 0) return null;

      if (isShuffle.value) {
        const others = queue.value.filter((t) => t.videoId !== track.videoId);
        if (others.length === 0) return track;
        const randomIdx = Math.floor(Math.random() * others.length);
        return others[randomIdx] ?? null;
      }

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
      isShuffle,
      repeatMode,
      hasNext,
      hasPrev,
      crossfadeEnabled,
      crossfadeDuration,
      setTrack,
      setQueue,
      addToQueue,
      nextTrack,
      prevTrack,
      syncDiscordPresence,
      isKaraoke,
      isAudioReactiveLyrics
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
          'isKaraoke',
          'isAudioReactiveLyrics'
        ],
        storage: piniaPluginPersistedstate.localStorage()
      }
    ]
  }
);
