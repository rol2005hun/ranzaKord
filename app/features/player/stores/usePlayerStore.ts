import type { Track, CrossfadeType, PlaybackContext } from '../types/player.types';

export const usePlayerStore = defineStore(
  'player',
  () => {
    const cookieLastPlayback = useCookie<{
      track: Track | null;
      currentTime: number;
    } | null>('player_last_playback', {
      default: () => null,
      maxAge: 31536000,
      path: '/'
    });

    const currentTrack = ref<Track | null>(cookieLastPlayback.value?.track || null);
    const queue = shallowRef<Track[]>([]);
    const unshuffledQueue = shallowRef<Track[]>([]);
    const playHistory = shallowRef<Track[]>([]);
    const isPlaying = ref(false);
    const volume = ref(0.8);
    const currentTimeSeconds = ref(0);
    const authStore = useAuthStore();

    function shuffleArray<T>(array: T[]): T[] {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j] as T, result[i] as T];
      }
      return result;
    }

    function getAuthHeaders(): Record<string, string> {
      if (!import.meta.client) return {};
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (!token) return {};
      return {
        Authorization: `Bearer ${token}`,
        'x-h3-session': token
      };
    }

    if (import.meta.client) {
      let initialTime = 0;
      const persistedPlayer = localStorage.getItem('player');
      if (persistedPlayer) {
        try {
          const parsed = JSON.parse(persistedPlayer);
          if (typeof parsed?.currentTimeSeconds === 'number' && parsed.currentTimeSeconds > 0) {
            initialTime = parsed.currentTimeSeconds;
          }
        } catch {
          void 0;
        }
      }

      const savedTime = localStorage.getItem('player_currentTimeSeconds');
      if (!initialTime && savedTime) {
        initialTime = Number(savedTime) || 0;
      } else if (!initialTime && cookieLastPlayback.value?.currentTime) {
        initialTime = cookieLastPlayback.value.currentTime || 0;
      }

      currentTimeSeconds.value = initialTime;

      const savedTrack = localStorage.getItem('player_currentTrack');
      if (savedTrack) {
        try {
          currentTrack.value = JSON.parse(savedTrack);
        } catch {
          void 0;
        }
      } else if (cookieLastPlayback.value?.track) {
        currentTrack.value = cookieLastPlayback.value.track;
      }

      if (currentTrack.value && !cookieLastPlayback.value?.track) {
        cookieLastPlayback.value = {
          track: currentTrack.value,
          currentTime: currentTimeSeconds.value
        };
      }

      const savedQueue = localStorage.getItem('player_queue');
      if (savedQueue) {
        try {
          queue.value = JSON.parse(savedQueue);
        } catch {
          void 0;
        }
      }

      const savedUnshuffled = localStorage.getItem('player_unshuffledQueue');
      if (savedUnshuffled) {
        try {
          unshuffledQueue.value = JSON.parse(savedUnshuffled);
        } catch {
          void 0;
        }
      }

      watch(
        currentTrack,
        (val) => {
          if (val) {
            localStorage.setItem('player_currentTrack', JSON.stringify(val));
            cookieLastPlayback.value = {
              track: val,
              currentTime: currentTimeSeconds.value
            };
          } else {
            localStorage.removeItem('player_currentTrack');
            cookieLastPlayback.value = null;
          }
        },
        { deep: true }
      );

      watch(
        queue,
        (val) => {
          if (val && val.length) localStorage.setItem('player_queue', JSON.stringify(val));
          else localStorage.removeItem('player_queue');
        },
        { deep: true }
      );

      watch(
        unshuffledQueue,
        (val) => {
          if (val && val.length)
            localStorage.setItem('player_unshuffledQueue', JSON.stringify(val));
          else localStorage.removeItem('player_unshuffledQueue');
        },
        { deep: true }
      );

      watchThrottled(
        currentTimeSeconds,
        (val) => {
          localStorage.setItem('player_currentTimeSeconds', String(val));
          if (currentTrack.value) {
            cookieLastPlayback.value = {
              track: currentTrack.value,
              currentTime: val
            };
          }

          if (authStore.isAuthenticated && currentTrack.value?.videoId) {
            try {
              const res = $fetch(useApiUrl('/api/me/playback'), {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: {
                  videoId: currentTrack.value.videoId,
                  currentTime: val,
                  title: currentTrack.value.title,
                  artist: currentTrack.value.artist,
                  thumbnailUrl: currentTrack.value.thumbnailUrl,
                  durationSeconds: currentTrack.value.durationSeconds
                }
              });
              if (res && res.catch) {
                res.catch(() => {
                  void 0;
                });
              }
            } catch {
              void 0;
            }
          }
        },
        { throttle: 5000 }
      );

      window.addEventListener('beforeunload', () => {
        const val = currentTimeSeconds.value;
        localStorage.setItem('player_currentTimeSeconds', String(val));
        if (currentTrack.value) {
          cookieLastPlayback.value = {
            track: currentTrack.value,
            currentTime: val
          };
        }
        if (authStore.isAuthenticated && currentTrack.value?.videoId) {
          try {
            $fetch(useApiUrl('/api/me/playback'), {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: {
                videoId: currentTrack.value.videoId,
                currentTime: val,
                title: currentTrack.value.title,
                artist: currentTrack.value.artist,
                thumbnailUrl: currentTrack.value.thumbnailUrl,
                durationSeconds: currentTrack.value.durationSeconds
              }
            });
          } catch {
            void 0;
          }
        }

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

      const syncPlaybackFromServer = async () => {
        if (!authStore?.isAuthenticated) {
          return;
        }
        try {
          const res = await $fetch<{
            lastPlayback: {
              videoId: string;
              currentTime: number;
              title?: string;
              artist?: string;
              thumbnailUrl?: string;
              durationSeconds?: number;
            } | null;
          }>(useApiUrl('/api/me/playback'), {
            headers: getAuthHeaders()
          });
          if (res?.lastPlayback) {
            const {
              videoId,
              currentTime,
              title,
              artist,
              thumbnailUrl,
              durationSeconds: dur
            } = res.lastPlayback;
            if (currentTrack.value?.videoId === videoId) {
              const localTime = currentTimeSeconds.value;
              if (currentTime > 0 && (localTime === 0 || currentTime > localTime)) {
                currentTimeSeconds.value = currentTime;
                localStorage.setItem('player_currentTimeSeconds', String(currentTime));
                if (currentTrack.value) {
                  cookieLastPlayback.value = {
                    track: currentTrack.value,
                    currentTime
                  };
                }
              } else if (localTime > 0 && currentTime < localTime && currentTrack.value) {
                try {
                  $fetch(useApiUrl('/api/me/playback'), {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: {
                      videoId,
                      currentTime: localTime,
                      title: currentTrack.value.title,
                      artist: currentTrack.value.artist,
                      thumbnailUrl: currentTrack.value.thumbnailUrl,
                      durationSeconds: currentTrack.value.durationSeconds
                    }
                  });
                } catch {
                  void 0;
                }
              }
            } else if (!currentTrack.value && videoId) {
              const restoredTrack: Track = {
                videoId,
                title: title || '',
                artist: artist || '',
                thumbnailUrl: thumbnailUrl || '',
                durationSeconds: dur || 0
              };
              currentTrack.value = restoredTrack;
              currentTimeSeconds.value = currentTime;
              localStorage.setItem('player_currentTrack', JSON.stringify(restoredTrack));
              localStorage.setItem('player_currentTimeSeconds', String(currentTime));
              cookieLastPlayback.value = {
                track: restoredTrack,
                currentTime
              };
            }
          }
        } catch {
          void 0;
        }
      };

      setTimeout(() => {
        void syncPlaybackFromServer();
      }, 1000);

      watch(
        () => authStore.isAuthenticated,
        (isAuth) => {
          if (isAuth) {
            void syncPlaybackFromServer();
          }
        }
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
    const isStereoWidener = ref(false);
    const bassBoostEnabled = ref(false);
    const playbackSpeed = ref(1.0);
    const preservesPitch = ref(true);
    const isSlowedReverb = ref(false);
    const isNightcore = ref(false);
    const reverbPreset = ref<'none' | 'room' | 'hall' | 'cathedral' | 'shower' | 'muffled'>('none');
    const isAudioReactiveLyrics = ref(true);
    const eqEnabled = ref(false);
    const eqPreset = ref('flat');
    const eqBands = ref<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    const playbackContext = ref<PlaybackContext | null>(null);
    const autoplayEnabled = ref(false);
    const globalShortcutsEnabled = ref(true);
    const sponsorBlockEnabled = ref(false);

    const hasNext = computed(() => {
      const track = currentTrack.value;
      if (!track) return false;
      if (repeatMode.value === 'all') return queue.value.length > 0;
      const idx = queue.value.findIndex(
        (t) => (track.queueId && t.queueId === track.queueId) || t.videoId === track.videoId
      );
      if (idx === -1) return false;
      if (playbackOrder.value === 'reverse') return idx > 0;
      if (idx < queue.value.length - 1) return true;
      return autoplayEnabled.value;
    });

    const hasPrev = computed(() => {
      const track = currentTrack.value;
      if (!track) return false;
      if (playHistory.value.length > 0) return true;
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
      const q = tracks.slice(0, 5000).map((t) => ({
        ...t,
        queueId: t.queueId || crypto.randomUUID()
      }));
      unshuffledQueue.value = q;

      if (playbackOrder.value === 'random') {
        queue.value = shuffleArray(q);
      } else {
        queue.value = [...q];
      }
    }

    function addToQueue(track: Track) {
      const newTrack = {
        ...track,
        queueId: track.queueId || crypto.randomUUID()
      };
      const newQueue = [...queue.value];
      newQueue.push(newTrack);
      if (newQueue.length > 5000) {
        newQueue.shift();
      }
      queue.value = newQueue;

      const newUnshuffled = [...unshuffledQueue.value];
      newUnshuffled.push(newTrack);
      if (newUnshuffled.length > 5000) {
        newUnshuffled.shift();
      }
      unshuffledQueue.value = newUnshuffled;
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
      if (playbackOrder.value !== 'random') {
        unshuffledQueue.value = [...queue.value];
      }
    }

    function removeFromQueue(index: number) {
      if (index >= 0 && index < queue.value.length) {
        const newQueue = [...queue.value];
        const removed = newQueue.splice(index, 1)[0];
        queue.value = newQueue;
        if (removed) {
          unshuffledQueue.value = unshuffledQueue.value.filter(
            (t) => t.queueId !== removed.queueId
          );
        }
      }
    }

    function clearQueue() {
      queue.value = [];
      unshuffledQueue.value = [];
    }

    function nextTrack(): Track | null {
      const track = currentTrack.value;
      if (!track) return null;
      if (queue.value.length === 0) return null;

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
    let lastEndTimestamp: number | null = null;

    const doSyncDiscord = async () => {
      if (!import.meta.client) return;
      try {
        const { isTauri, invoke } = await import('@tauri-apps/api/core');
        if (isTauri()) {
          if (isPlaying.value && currentTrack.value) {
            const startTimestamp = Math.round(Date.now() / 1000 - currentTimeSeconds.value) + 1;

            const currentDuration =
              durationSeconds.value > 0
                ? durationSeconds.value
                : currentTrack.value.durationSeconds || 0;

            const endTimestamp =
              currentDuration > 0 ? Math.round(startTimestamp + currentDuration) : null;

            const isSameTrack = lastTrackId === currentTrack.value.videoId;
            const isSamePlaying = lastIsPlaying === isPlaying.value;
            const isSameEnd = lastEndTimestamp === endTimestamp;
            const drift = Math.abs(startTimestamp - lastStartTimestamp);

            if (isSameTrack && isSamePlaying && isSameEnd && drift <= 2) {
              return;
            }

            lastStartTimestamp = startTimestamp;
            lastTrackId = currentTrack.value.videoId;
            lastIsPlaying = isPlaying.value;
            lastEndTimestamp = endTimestamp;

            const config = useRuntimeConfig();
            const rawBaseUrl = (config.public.baseUrl as string) || '';
            const baseUrl = rawBaseUrl.replace(/\/+$/, '');
            const buttonUrl = baseUrl
              ? `${baseUrl}/?play=${currentTrack.value.videoId}`
              : undefined;

            await invoke('set_discord_presence', {
              details: currentTrack.value.title,
              stateStr: currentTrack.value.artist,
              largeImage: currentTrack.value.thumbnailUrl,
              buttonUrl: buttonUrl,
              startTimestamp,
              endTimestamp
            });
          } else {
            lastIsPlaying = false;
            lastTrackId = '';
            lastStartTimestamp = 0;
            lastEndTimestamp = null;
            await invoke('clear_discord_presence');
          }
        }
      } catch {
        void 0;
      }
    };

    const syncDiscordPresence = useThrottleFn(doSyncDiscord, 2000, true);

    if (import.meta.client) {
      watch(
        () => durationSeconds.value,
        (newDuration) => {
          if (newDuration > 0 && isPlaying.value) {
            if (currentTrack.value && !currentTrack.value.durationSeconds) {
              currentTrack.value.durationSeconds = newDuration;
            }
            syncDiscordPresence();
          }
        }
      );
      watch(
        () => isPlaying.value,
        (playing) => {
          if (!playing) {
            doSyncDiscord();
          } else {
            syncDiscordPresence();
          }
        }
      );

      watch(
        () => currentTrack.value?.videoId,
        () => {
          syncDiscordPresence();
        }
      );

      useIntervalFn(() => {
        if (isPlaying.value) {
          syncDiscordPresence();
        }
      }, 5000);

      watch(playbackOrder, (newOrder, oldOrder) => {
        if (newOrder === 'random' && oldOrder !== 'random') {
          const track = currentTrack.value;
          const q = [...queue.value];
          const idx = track
            ? q.findIndex(
                (t) => (track.queueId && t.queueId === track.queueId) || t.videoId === track.videoId
              )
            : -1;

          if (idx >= 0 && idx < q.length - 1) {
            const before = q.slice(0, idx + 1);
            const after = q.slice(idx + 1);
            queue.value = [...before, ...shuffleArray(after)];
          } else if (idx === -1) {
            queue.value = shuffleArray(q);
          }
        } else if (newOrder !== 'random' && oldOrder === 'random') {
          queue.value = [...unshuffledQueue.value];
        }
      });
    }

    const visibleQueueStartIndex = computed(() => {
      const track = currentTrack.value;
      if (!track) return 0;

      const idx = queue.value.findIndex(
        (t) => (track.queueId && t.queueId === track.queueId) || t.videoId === track.videoId
      );
      if (idx === -1) return 0;

      return Math.max(0, idx - 10);
    });

    const visibleQueue = computed(() => {
      const track = currentTrack.value;
      if (!track) return queue.value.slice(0, 21);

      const idx = queue.value.findIndex(
        (t) => (track.queueId && t.queueId === track.queueId) || t.videoId === track.videoId
      );
      if (idx === -1) return queue.value.slice(0, 21);

      const start = Math.max(0, idx - 10);
      const end = Math.min(queue.value.length, idx + 10 + 1);
      return queue.value.slice(start, end);
    });

    function setSlowedReverb(enable: boolean) {
      isSlowedReverb.value = enable;
      if (enable) {
        isNightcore.value = false;
        playbackSpeed.value = 0.85;
        preservesPitch.value = false;
        reverbPreset.value = 'hall';
      } else {
        if (playbackSpeed.value === 0.85) {
          playbackSpeed.value = 1.0;
          preservesPitch.value = true;
        }
        if (reverbPreset.value === 'hall') {
          reverbPreset.value = 'none';
        }
      }
    }

    function setNightcore(enable: boolean) {
      isNightcore.value = enable;
      if (enable) {
        isSlowedReverb.value = false;
        playbackSpeed.value = 1.25;
        preservesPitch.value = false;
        reverbPreset.value = 'none';
      } else {
        if (playbackSpeed.value === 1.25) {
          playbackSpeed.value = 1.0;
          preservesPitch.value = true;
        }
      }
    }

    function setSpeed(speed: number) {
      playbackSpeed.value = Math.round(speed * 100) / 100;
      if (playbackSpeed.value !== 0.85 && isSlowedReverb.value) {
        isSlowedReverb.value = false;
      }
      if (playbackSpeed.value !== 1.25 && isNightcore.value) {
        isNightcore.value = false;
      }
    }

    function setSpatialAudio(enable: boolean) {
      isSpatialAudio.value = enable;
      if (enable) {
        isStereoWidener.value = false;
      }
    }

    function setStereoWidener(enable: boolean) {
      isStereoWidener.value = enable;
      if (enable) {
        isSpatialAudio.value = false;
      }
    }

    return {
      currentTrack,
      queue,
      playHistory,
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
      isStereoWidener,
      bassBoostEnabled,
      playbackSpeed,
      preservesPitch,
      isSlowedReverb,
      isNightcore,
      reverbPreset,
      setSlowedReverb,
      setNightcore,
      setSpeed,
      setSpatialAudio,
      setStereoWidener,
      isAudioReactiveLyrics,
      eqEnabled,
      eqPreset,
      eqBands,
      playbackContext,
      autoplayEnabled,
      globalShortcutsEnabled,
      sponsorBlockEnabled,
      visibleQueue,
      visibleQueueStartIndex
    };
  },
  {
    persist: [
      {
        pick: [
          'currentTrack',
          'currentTimeSeconds',
          'volume',
          'durationSeconds',
          'playbackOrder',
          'playHistory',
          'repeatMode',
          'queue',
          'unshuffledQueue',
          'crossfadeEnabled',
          'crossfadeDuration',
          'crossfadeType',
          'isKaraoke',
          'isSpatialAudio',
          'isStereoWidener',
          'bassBoostEnabled',
          'playbackSpeed',
          'preservesPitch',
          'isSlowedReverb',
          'isNightcore',
          'reverbPreset',
          'isAudioReactiveLyrics',
          'eqEnabled',
          'eqPreset',
          'eqBands',
          'playbackContext',
          'autoplayEnabled',
          'globalShortcutsEnabled',
          'sponsorBlockEnabled'
        ],
        storage: import.meta.client ? piniaPluginPersistedstate.localStorage() : undefined
      }
    ]
  }
);
