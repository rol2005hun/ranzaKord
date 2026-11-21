import type {
  MusicVideoSearchResponse,
  MusicVideoTrackInput
} from '@/features/player/types/player.types';

const musicVideoUrl = ref<string | null>(null);
const isLoading = ref<boolean>(false);
const isNotFound = ref<boolean>(false);
const lastTrackKey = ref<string>('');

export function useMusicVideo() {
  async function fetchMusicVideo(track: MusicVideoTrackInput): Promise<void> {
    const artistName = track.artist || track.artists?.[0]?.name || '';
    const key = `${track.title}__${artistName}`;

    if (key === lastTrackKey.value && (musicVideoUrl.value || isNotFound.value)) {
      return;
    }

    lastTrackKey.value = key;
    musicVideoUrl.value = null;
    isNotFound.value = false;
    isLoading.value = true;

    try {
      if (!track.title && !artistName) {
        isNotFound.value = true;
        return;
      }

      const data = await $fetch<MusicVideoSearchResponse>(useApiUrl('/api/musicvideo'), {
        params: { artist: artistName, title: track.title }
      });

      if (data.results.length > 0) {
        const first = data.results[0];
        const vidId = first?.videoId;
        if (!vidId) {
          isNotFound.value = true;
        } else {
          musicVideoUrl.value = useApiUrl(`/api/stream?v=${vidId}&type=video`);
        }
      } else {
        isNotFound.value = true;
      }
    } catch {
      isNotFound.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function resetMusicVideo(): void {
    musicVideoUrl.value = null;
    isNotFound.value = false;
    isLoading.value = false;
    lastTrackKey.value = '';
  }

  return {
    musicVideoUrl,
    isLoading,
    isNotFound,
    fetchMusicVideo,
    resetMusicVideo
  };
}
