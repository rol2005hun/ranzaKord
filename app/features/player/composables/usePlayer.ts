import type { Track } from '../types/player.types';

const audioRef = ref<HTMLAudioElement | null>(null);

export function usePlayer() {
  const store = usePlayerStore();

  function bindAudio(el: HTMLAudioElement) {
    audioRef.value = el;

    el.addEventListener('timeupdate', () => {
      store.currentTimeSeconds = el.currentTime;
    });

    el.addEventListener('durationchange', () => {
      if (isFinite(el.duration)) {
        store.durationSeconds = el.duration;
      }
    });

    el.addEventListener('ended', () => {
      store.isPlaying = false;
      if (store.repeatMode === 'one') {
        seek(0);
        resume();
      } else {
        const next = store.nextTrack();
        if (next) playTrack(next);
      }
    });

    el.addEventListener('error', () => {
      store.isLoading = false;
      store.isPlaying = false;
      store.error = 'Playback error. Please try again.';
    });

    el.volume = store.volume;

    if (store.currentTrack) {
      const savedTime = store.currentTimeSeconds;
      const wasPlaying = store.isPlaying;

      if (wasPlaying) {
        store.isLoading = true;
      }

      el.src = `/api/stream?v=${store.currentTrack.videoId}`;
      el.load();

      el.addEventListener('loadedmetadata', function onLoaded() {
        if (savedTime > 0) {
          el.currentTime = savedTime;
          store.currentTimeSeconds = savedTime;
        }
        if (wasPlaying) {
          el.play()
            .then(() => {
              store.isPlaying = true;
            })
            .catch(() => {
              store.isPlaying = false;
            })
            .finally(() => {
              store.isLoading = false;
            });
        }
        el.removeEventListener('loadedmetadata', onLoaded);
      });
    }
  }

  async function playTrack(track: Track) {
    store.setTrack(track);
    store.isLoading = true;
    store.isPlaying = false;
    store.error = null;

    try {
      await nextTick();

      if (!audioRef.value) {
        store.isLoading = false;
        return;
      }

      // Point the audio element directly to our stream proxy endpoint
      audioRef.value.src = `/api/stream?v=${track.videoId}`;
      audioRef.value.load();

      await audioRef.value.play();
      store.isPlaying = true;
    } catch {
      store.error = 'Failed to load stream. Are you signed in?';
    } finally {
      store.isLoading = false;
    }
  }

  function pause() {
    audioRef.value?.pause();
    store.isPlaying = false;
  }

  function resume() {
    audioRef.value
      ?.play()
      .then(() => {
        store.isPlaying = true;
      })
      .catch(() => {
        store.isPlaying = false;
      });
  }

  function togglePlay() {
    if (store.isPlaying) {
      pause();
    } else {
      resume();
    }
  }

  function seek(seconds: number) {
    if (audioRef.value) {
      audioRef.value.currentTime = seconds;
      store.currentTimeSeconds = seconds;
    }
  }

  function setVolume(value: number) {
    store.volume = value;
    if (audioRef.value) {
      audioRef.value.volume = value;
    }
  }

  function playNext() {
    const next = store.nextTrack();
    if (next) playTrack(next);
  }

  function playPrev() {
    if (store.currentTimeSeconds > 3) {
      seek(0);
      return;
    }
    const prev = store.prevTrack();
    if (prev) playTrack(prev);
  }

  function toggleShuffle() {
    store.isShuffle = !store.isShuffle;
  }

  function toggleRepeat() {
    if (store.repeatMode === 'off') store.repeatMode = 'all';
    else if (store.repeatMode === 'all') store.repeatMode = 'one';
    else store.repeatMode = 'off';
  }

  function addToQueue(track: Track) {
    store.addToQueue(track);
  }

  return {
    currentTrack: computed(() => store.currentTrack),
    isPlaying: computed(() => store.isPlaying),
    isLoading: computed(() => store.isLoading),
    volume: computed(() => store.volume),
    currentTimeSeconds: computed(() => store.currentTimeSeconds),
    durationSeconds: computed(() => store.durationSeconds),
    error: computed(() => store.error),
    isShuffle: computed(() => store.isShuffle),
    repeatMode: computed(() => store.repeatMode),
    hasNext: computed(() => store.hasNext),
    hasPrev: computed(() => store.hasPrev),
    bindAudio,
    playTrack,
    addToQueue,
    pause,
    resume,
    togglePlay,
    seek,
    setVolume,
    playNext,
    playPrev,
    toggleShuffle,
    toggleRepeat
  };
}
