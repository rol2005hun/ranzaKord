import type { Track } from '../types/player.types';

export const usePlayerStore = defineStore('player', () => {
  const currentTrack = ref<Track | null>(null);
  const queue = ref<Track[]>([]);
  const isPlaying = ref(false);
  const volume = ref(0.8);
  const currentTimeSeconds = ref(0);
  const durationSeconds = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const hasNext = computed(() => {
    const track = currentTrack.value;
    if (!track) return false;
    const idx = queue.value.findIndex((t) => t.videoId === track.videoId);
    return idx >= 0 && idx < queue.value.length - 1;
  });

  const hasPrev = computed(() => {
    const track = currentTrack.value;
    if (!track) return false;
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
    const idx = queue.value.findIndex((t) => t.videoId === track.videoId);
    if (idx >= 0 && idx < queue.value.length - 1) {
      return queue.value[idx + 1] ?? null;
    }
    return null;
  }

  function prevTrack(): Track | null {
    const track = currentTrack.value;
    if (!track) return null;
    const idx = queue.value.findIndex((t) => t.videoId === track.videoId);
    if (idx > 0) {
      return queue.value[idx - 1] ?? null;
    }
    return null;
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
    hasNext,
    hasPrev,
    setTrack,
    setQueue,
    addToQueue,
    nextTrack,
    prevTrack
  };
});
