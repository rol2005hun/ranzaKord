import type { Track, TrackStatPayload } from '../types/player.types';

const { registerPauseCallback, onTrackEnded: sleepTimerOnTrackEnded } = useSleepTimer();

const audio1Ref = ref<HTMLAudioElement | null>(null);
const audio2Ref = ref<HTMLAudioElement | null>(null);
const activeAudioIndex = ref(0);

const activeAudio = computed(() =>
  activeAudioIndex.value === 0 ? audio1Ref.value : audio2Ref.value
);

let crossfadeGain1 = 1.0;
let crossfadeGain2 = 0.0;
let isCrossfading = false;
let crossfadeTriggered = false;

export function usePlayer() {
  const store = usePlayerStore();
  const nuxtApp = useNuxtApp();
  const t = nuxtApp.$i18n.t;
  const config = useRuntimeConfig();

  function getApiUrl(path: string) {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const isTauriProd = import.meta.client && '__TAURI_INTERNALS__' in window && !import.meta.dev;
    if (isTauriProd) return `${config.public.baseUrl}${normalizedPath}`;
    return normalizedPath;
  }

  let isRestoring = false;

  const { setGains, setEqGains } = useAudioVisualizer();

  watch(
    () => store.eqEnabled,
    (enabled) => setEqGains(store.eqBands, enabled)
  );

  watch(
    () => store.eqBands,
    (bands) => setEqGains(bands, store.eqEnabled),
    { deep: true }
  );

  function applyVolumes() {
    setGains(crossfadeGain1, crossfadeGain2, store.volume, audio1Ref.value, audio2Ref.value);
  }

  function bindAudio(el1: HTMLAudioElement, el2: HTMLAudioElement) {
    audio1Ref.value = el1;
    audio2Ref.value = el2;
    activeAudioIndex.value = 0;
    crossfadeGain1 = 1.0;
    crossfadeGain2 = 0.0;
    isCrossfading = false;
    crossfadeTriggered = false;

    const els = [el1, el2];

    els.forEach((el, index) => {
      el.addEventListener('timeupdate', () => {
        if (isRestoring) return;
        if (index === activeAudioIndex.value) {
          store.currentTimeSeconds = el.currentTime;

          const actualDuration = store.currentTrack?.durationSeconds || 0;
          if (
            store.crossfadeEnabled &&
            store.crossfadeDuration > 0 &&
            actualDuration > 0 &&
            store.hasNext &&
            !isCrossfading &&
            !crossfadeTriggered
          ) {
            const timeLeft = actualDuration - el.currentTime;
            if (timeLeft <= store.crossfadeDuration) {
              crossfadeTriggered = true;
              startCrossfade();
            }
          }
        }
      });

      el.addEventListener('durationchange', () => {
        if (index === activeAudioIndex.value && isFinite(el.duration)) {
          store.durationSeconds = el.duration;
        }
      });

      el.addEventListener('play', () => {
        if (index === activeAudioIndex.value) store.isPlaying = true;
      });

      el.addEventListener('pause', () => {
        if (index === activeAudioIndex.value && !isCrossfading) {
          store.isPlaying = false;
        }
      });

      el.addEventListener('ended', () => {
        if (index !== activeAudioIndex.value) return;
        store.isPlaying = false;
        if (store.currentTrack) {
          recordTrackStat(store.currentTrack, Math.floor(el.currentTime), false);
        }
        sleepTimerOnTrackEnded();
        if (store.repeatMode === 'one') {
          seek(0);
          resume();
        } else {
          if (!isCrossfading) {
            const next = store.nextTrack();
            if (next) playTrack(next);
          }
        }
      });

      el.addEventListener('error', () => {
        if (index === activeAudioIndex.value) {
          store.isLoading = false;
          store.isPlaying = false;
          store.error = t('player.errors.playback');
        }
      });
    });

    applyVolumes();

    if (store.currentTrack) {
      const savedTime = store.currentTimeSeconds;
      const wasPlaying = store.isPlaying;

      if (wasPlaying) store.isLoading = true;
      if (savedTime > 0) isRestoring = true;

      const el = el1;
      el.src = getApiUrl(`/api/stream?v=${store.currentTrack.videoId}`);
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

  function startCrossfade() {
    const nextTrack = store.nextTrack();
    if (!nextTrack) return;

    const outAudio = activeAudio.value;
    const outIndex = activeAudioIndex.value;

    activeAudioIndex.value = activeAudioIndex.value === 0 ? 1 : 0;
    const inAudio = activeAudio.value;

    if (!inAudio) return;

    isCrossfading = true;

    inAudio.src = getApiUrl(`/api/stream?v=${nextTrack.videoId}`);
    inAudio.load();
    inAudio.play().catch(() => {});

    store.setTrack(nextTrack);
    store.isPlaying = true;

    const durationMs = store.crossfadeDuration * 1000;
    const startTime = performance.now();

    let rafId: number;

    function step(now?: number) {
      if (!isCrossfading) return;
      const currentNow = now ?? performance.now();
      const elapsed = currentNow - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / durationMs));

      let fadeOut: number;
      let fadeIn: number;

      if (store.crossfadeType === 'dj') {
        fadeOut = Math.cos(progress * 0.5 * Math.PI);
        fadeIn = Math.sin(progress * 0.5 * Math.PI);
      } else {
        fadeOut = 1 - progress;
        fadeIn = progress;
      }

      if (outIndex === 0) {
        crossfadeGain1 = fadeOut;
        crossfadeGain2 = fadeIn;
      } else {
        crossfadeGain2 = fadeOut;
        crossfadeGain1 = fadeIn;
      }

      applyVolumes();

      if (progress >= 1) {
        isCrossfading = false;
        crossfadeTriggered = false;
        outAudio?.pause();
        if (outAudio) outAudio.currentTime = 0;
        cancelAnimationFrame(rafId);
        clearInterval(intervalId);
      }
    }

    function loop(now: number) {
      if (isCrossfading) {
        step(now);
        rafId = requestAnimationFrame(loop);
      }
    }

    // Run both: rAF for smooth 60fps in foreground, setInterval fallback for background tabs
    rafId = requestAnimationFrame(loop);
    const intervalId = setInterval(() => step(), 100);
  }

  function recordTrackStat(track: Track, listeningSeconds: number, skipped: boolean) {
    const payload: TrackStatPayload = {
      trackId: track.videoId,
      title: track.title,
      artist: track.artist,
      thumbnailUrl: track.thumbnailUrl,
      durationSeconds: track.durationSeconds,
      listeningSeconds,
      skipped
    };
    $fetch('/api/player/track-stat', {
      method: 'POST',
      body: payload
    }).catch(() => {});
  }

  let isFetchingMore = false;

  async function checkAndFetchMore(currentTrackId: string) {
    if (isFetchingMore || store.playbackOrder !== 'sequential') return;
    const ctx = store.playbackContext;
    if (!ctx || ctx.type === 'none') {
      if (!store.autoplayEnabled) return;
    }

    const q = store.queue;
    const idx = q.findIndex((t) => t.videoId === currentTrackId);
    if (idx < 0) return;

    // Check if we are near the end of the queue (e.g. 3 tracks remaining)
    const tracksRemaining = q.length - 1 - idx;
    if (tracksRemaining > 3) return;

    isFetchingMore = true;

    try {
      if (ctx?.type === 'playlist' && ctx.sourceId && ctx.totalItems) {
        if (ctx.currentOffset < ctx.totalItems) {
          const limit = 50;
          const { $pinia } = useNuxtApp();
          const pStore = (
            await import('../../playlists/stores/usePlaylistsStore')
          ).usePlaylistsStore($pinia);
          const result = await pStore.fetchDetail(ctx.sourceId, {
            offset: ctx.currentOffset,
            limit
          });
          if (result && result.tracks.length > 0) {
            const mapped = result.tracks.map((t) => ({
              videoId: t.videoId,
              title: t.title,
              artist: t.artist,
              artistId: t.artistId,
              artists: t.artists?.length
                ? t.artists.map((a) => ({ name: a.name, id: a.channelId }))
                : t.artist
                    .split(/,\s*|\s+feat\.\s+|\s+ft\.\s+|\s+&\s+/i)
                    .map((s) => ({ name: s.trim() }))
                    .filter((a) => a.name),
              thumbnailUrl: t.thumbnailUrl,
              durationSeconds: Math.round(t.durationMs / 1000)
            }));
            mapped.forEach((t) => store.addToQueue(t));
            if (store.playbackContext) {
              store.playbackContext.currentOffset += limit;
            }
          }
        } else if (store.autoplayEnabled) {
          // Playlist finished, fallback to radio if autoplay is enabled
          await fetchRadioNext(currentTrackId);
        }
      } else if (store.autoplayEnabled) {
        await fetchRadioNext(currentTrackId);
      }
    } catch (e) {
      console.error('Failed to fetch more tracks', e);
    } finally {
      isFetchingMore = false;
    }
  }

  async function fetchRadioNext(videoId: string) {
    const res = await $fetch<Track[]>(`/api/search/related?videoId=${videoId}`).catch(() => []);
    if (res && res.length > 0) {
      const filtered = res.filter((rt) => !store.queue.some((qt) => qt.videoId === rt.videoId));
      if (filtered.length > 0) {
        // take first 5-10
        filtered.slice(0, 10).forEach((t) => store.addToQueue(t));
      }
    }
  }

  async function playTrack(track: Track, fromHistory = false) {
    if (store.currentTrack?.videoId === track.videoId && !store.error) {
      togglePlay();
      return;
    }

    isCrossfading = false;
    crossfadeTriggered = false;

    if (store.currentTrack && store.currentTimeSeconds > 0) {
      const skipped = store.currentTimeSeconds < store.durationSeconds * 0.9;
      recordTrackStat(store.currentTrack, Math.floor(store.currentTimeSeconds), skipped);
    }

    store.setTrack(track, fromHistory);
    store.isLoading = true;
    store.isPlaying = false;
    store.error = null;

    checkAndFetchMore(track.videoId);

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
      const el = activeAudio.value;
      if (!el) {
        store.isLoading = false;
        return;
      }

      crossfadeGain1 = activeAudioIndex.value === 0 ? 1.0 : 0.0;
      crossfadeGain2 = activeAudioIndex.value === 1 ? 1.0 : 0.0;
      applyVolumes();

      const otherEl = activeAudioIndex.value === 0 ? audio2Ref.value : audio1Ref.value;
      if (otherEl) {
        otherEl.pause();
        otherEl.currentTime = 0;
      }

      el.src = getApiUrl(`/api/stream?v=${track.videoId}`);
      el.load();

      // Ensure visualizer and audio-reactive loop are connected
      const { connect } = useAudioVisualizer();
      if (audio1Ref.value && audio2Ref.value) {
        connect(audio1Ref.value, audio2Ref.value, store.volume);
      }

      await el.play();
      store.isPlaying = true;
    } catch {
      store.error = t('player.errors.stream');
    } finally {
      store.isLoading = false;
    }
  }

  function pause() {
    activeAudio.value?.pause();
    store.isPlaying = false;
  }

  registerPauseCallback(pause);

  function resume() {
    activeAudio.value
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
      if (store.error && store.currentTrack) {
        playTrack(store.currentTrack, true);
      } else {
        resume();
      }
    }
  }

  function seek(seconds: number) {
    if (activeAudio.value) {
      activeAudio.value.currentTime = seconds;
      store.currentTimeSeconds = seconds;
      store.syncDiscordPresence();
    }
  }

  function setVolume(value: number) {
    store.volume = value;
    applyVolumes();
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
    if (prev) playTrack(prev, true);
  }

  function toggleShuffle() {
    if (store.playbackOrder === 'random') {
      store.playbackOrder = 'sequential';
    } else {
      store.playbackOrder = 'random';
    }
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

  function toggleKaraoke() {
    store.isKaraoke = !store.isKaraoke;
    const { setKaraoke } = useAudioVisualizer();
    setKaraoke(store.isKaraoke);
  }

  return {
    currentTrack: computed(() => store.currentTrack),
    isPlaying: computed(() => store.isPlaying),
    isLoading: computed(() => store.isLoading),
    volume: computed(() => store.volume),
    currentTimeSeconds: computed(() => store.currentTimeSeconds),
    durationSeconds: computed(() => store.durationSeconds),
    error: computed(() => store.error),
    playbackOrder: computed(() => store.playbackOrder),
    repeatMode: computed(() => store.repeatMode),
    hasNext: computed(() => store.hasNext),
    hasPrev: computed(() => store.hasPrev),
    audioElement: activeAudio,
    audioElement1: computed(() => audio1Ref.value),
    audioElement2: computed(() => audio2Ref.value),
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
    playQueue,
    isKaraoke: computed(() => store.isKaraoke),
    toggleKaraoke
  };
}
