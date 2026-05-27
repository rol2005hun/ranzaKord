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
      setTrack,
      setQueue,
      addToQueue,
      nextTrack,
      prevTrack
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
          'isPlaying'
        ],
        storage: piniaPluginPersistedstate.cookies({
          maxAge: 31536000 // 1 year
        })
      },
      {
        pick: ['queue'],
        storage: piniaPluginPersistedstate.localStorage()
      }
    ]
  }
);
