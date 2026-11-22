import type {
  MusicVideoSearchResponse,
  MusicVideoTrackInput
} from '@/features/player/types/player.types';

const musicVideoUrl = ref<string | null>(null);
const isLoading = ref<boolean>(false);
const isNotFound = ref<boolean>(false);
const lastTrackKey = ref<string>('');
const videoCache = new Map<string, string>();
const pendingPreloads = new Map<string, Promise<string | null>>();

function getTrackKey(track: MusicVideoTrackInput): string {
  const artistName = track.artist || track.artists?.[0]?.name || '';
  return `${track.title}__${artistName}`;
}

async function requestVideoUrl(track: MusicVideoTrackInput): Promise<string | null> {
  const artistName = track.artist || track.artists?.[0]?.name || '';
  if (!track.title && !artistName) return null;

  const data = await $fetch<MusicVideoSearchResponse>(useApiUrl('/api/musicvideo'), {
    params: { artist: artistName, title: track.title }
  });

  if (data.results.length > 0) {
    const vidId = data.results[0]?.videoId;
    if (vidId) {
      const streamUrl = useApiUrl(`/api/stream?v=${vidId}&type=video`);
      fetch(streamUrl, {
        method: 'GET',
        headers: { Range: 'bytes=0-1024' }
      }).catch(() => {});
      return streamUrl;
    }
  }

  return null;
}

export function useMusicVideo() {
  async function preloadMusicVideo(track: MusicVideoTrackInput): Promise<void> {
    const artistName = track.artist || track.artists?.[0]?.name || '';
    if (!track.title && !artistName) return;

    const key = getTrackKey(track);
    if (videoCache.has(key) || pendingPreloads.has(key)) return;

    const promise = requestVideoUrl(track)
      .then((url) => {
        if (url) {
          videoCache.set(key, url);
        }
        return url;
      })
      .catch(() => null)
      .finally(() => {
        pendingPreloads.delete(key);
      });

    pendingPreloads.set(key, promise);
    await promise;
  }

  async function fetchMusicVideo(track: MusicVideoTrackInput): Promise<void> {
    const artistName = track.artist || track.artists?.[0]?.name || '';
    const key = getTrackKey(track);

    if (key === lastTrackKey.value && (musicVideoUrl.value || isNotFound.value)) {
      return;
    }

    lastTrackKey.value = key;

    const cachedUrl = videoCache.get(key);
    if (cachedUrl) {
      musicVideoUrl.value = cachedUrl;
      isNotFound.value = false;
      isLoading.value = false;
      return;
    }

    musicVideoUrl.value = null;
    isNotFound.value = false;
    isLoading.value = true;

    try {
      if (!track.title && !artistName) {
        isNotFound.value = true;
        return;
      }

      let streamUrl: string | null = null;
      const pending = pendingPreloads.get(key);
      if (pending) {
        streamUrl = await pending;
      } else {
        streamUrl = await requestVideoUrl(track);
        if (streamUrl) {
          videoCache.set(key, streamUrl);
        }
      }

      if (lastTrackKey.value !== key) return;

      if (streamUrl) {
        musicVideoUrl.value = streamUrl;
      } else {
        isNotFound.value = true;
      }
    } catch {
      if (lastTrackKey.value === key) {
        isNotFound.value = true;
      }
    } finally {
      if (lastTrackKey.value === key) {
        isLoading.value = false;
      }
    }
  }

  function resetMusicVideo(): void {
    if (lastTrackKey.value) {
      videoCache.delete(lastTrackKey.value);
    }
    musicVideoUrl.value = null;
    isNotFound.value = false;
    isLoading.value = false;
    lastTrackKey.value = '';
  }

  function clearVideoCache(): void {
    videoCache.clear();
    pendingPreloads.clear();
  }

  return {
    musicVideoUrl,
    isLoading,
    isNotFound,
    fetchMusicVideo,
    preloadMusicVideo,
    resetMusicVideo,
    clearVideoCache
  };
}
