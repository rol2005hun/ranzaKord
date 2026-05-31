import type { Track } from '../types/player.types';

const audioRef = ref<HTMLAudioElement | null>(null);

export function usePlayer() {
  const store = usePlayerStore();
  const { t } = useI18n();

  let isRestoring = false;

  function bindAudio(el: HTMLAudioElement) {
    audioRef.value = el;

    el.addEventListener('timeupdate', () => {
      if (isRestoring) return;
      store.currentTimeSeconds = el.currentTime;
    });

    el.addEventListener('durationchange', () => {
      if (isFinite(el.duration)) {
        store.durationSeconds = el.duration;
      }
    });

    el.addEventListener('play', () => {
      store.isPlaying = true;
    });

    el.addEventListener('pause', () => {
      store.isPlaying = false;
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
      store.error = t('player.errors.playback');
    });

    el.volume = Math.pow(store.volume, 3);

    if (store.currentTrack) {
      const savedTime = store.currentTimeSeconds;
      const wasPlaying = store.isPlaying;

      if (wasPlaying) {
        store.isLoading = true;
      }

      if (savedTime > 0) {
        isRestoring = true;
      }

      el.src = `/api/stream?v=${store.currentTrack.videoId}`;
      el.load();

      el.addEventListener('loadedmetadata', function onLoaded() {
        if (savedTime > 0) {
          el.currentTime = savedTime;
          store.currentTimeSeconds = savedTime;
          setTimeout(() => {
            isRestoring = false;
          }, 50);
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
    if (store.currentTrack?.videoId === track.videoId) {
      togglePlay();
      return;
    }

    store.setTrack(track);
    store.isLoading = true;
    store.isPlaying = false;
    store.error = null;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        artwork: track.thumbnailUrl ? [{ src: track.thumbnailUrl, sizes: '512x512' }] : []
      });
      navigator.mediaSession.setActionHandler('play', resume);
      navigator.mediaSession.setActionHandler('pause', pause);
      navigator.mediaSession.setActionHandler('previoustrack', playPrev);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }

    try {
      await nextTick();

      if (!audioRef.value) {
        store.isLoading = false;
        return;
      }

      audioRef.value.src = `/api/stream?v=${track.videoId}`;
      audioRef.value.load();

      await audioRef.value.play();
      store.isPlaying = true;
    } catch {
      store.error = t('player.errors.stream');
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
      store.syncDiscordPresence();
    }
  }

  function setVolume(value: number) {
    store.volume = value;
    if (audioRef.value) {
      audioRef.value.volume = Math.pow(value, 3);
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

  function setQueue(tracks: Track[]) {
    store.setQueue(tracks);
  }

  function playQueue(tracks: Track[], startIndex = 0) {
    store.setQueue(tracks);
    const track = tracks[startIndex];
    if (track) {
      playTrack(track);
    }
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
    toggleRepeat,
    setQueue,
    playQueue
  };
}
