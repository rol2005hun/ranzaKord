import type { ArtistDetail, SearchResult, PaginatedSongs } from '../types/search.types';
import type { Track } from '@/features/player/types/player.types';
import type { TrackListItem } from '@/components/shared/TrackList.vue';

export function useArtist(id: string) {
  const headers = useRequestHeaders(['cookie']);
  const {
    data: artist,
    status,
    error
  } = useFetch<ArtistDetail>('/api/artist', {
    headers,
    query: { id },
    lazy: true,
    getCachedData(key) {
      const nuxtApp = useNuxtApp();
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
    }
  });

  const { playTrack, togglePlay, isPlaying, currentTrack, playQueue } = usePlayer();
  const playerStore = usePlayerStore();

  const allSongs = ref<SearchResult[]>([]);

  const continuation = ref<string | null>(null);
  const isLoadingSongs = ref(false);
  const retryCount = ref(0);

  const isArtistPlaying = computed(() => {
    if (allSongs.value.length === 0) return false;
    if (!isPlaying.value) return false;
    return allSongs.value.some((t: SearchResult) => t.id === currentTrack.value?.videoId);
  });

  const isArtistLoading = computed(() => {
    if (allSongs.value.length === 0) return false;
    if (!playerStore.isLoading) return false;
    return allSongs.value.some((t: SearchResult) => t.id === currentTrack.value?.videoId);
  });

  const mappedTopSongs = computed<TrackListItem[]>(() => {
    if (!artist.value?.topSongs) return [];
    return artist.value.topSongs.slice(0, 10).map((song) => {
      let duration = song.durationSeconds;
      if (!duration) {
        const found = allSongs.value.find((s) => s.id === song.id);
        if (found?.durationSeconds) {
          duration = found.durationSeconds;
        }
      }
      let playsStr = song.plays;
      if (playsStr) {
        playsStr = playsStr.split(' ')[0];
      }

      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        artistId: song.artistId,
        thumbnailUrl: song.thumbnailUrl,
        durationSeconds: duration || 0,
        plays: playsStr,
        isPlaying: isPlaying.value && currentTrack.value?.videoId === song.id
      };
    });
  });

  const mappedAllSongs = computed<TrackListItem[]>(() =>
    allSongs.value.map((song) => {
      let playsStr = song.plays;
      if (playsStr) {
        playsStr = playsStr.split(' ')[0];
      }

      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        artistId: song.artistId,
        thumbnailUrl: song.thumbnailUrl,
        durationSeconds: song.durationSeconds || 0,
        plays: playsStr,
        isPlaying: isPlaying.value && currentTrack.value?.videoId === song.id
      };
    })
  );

  async function loadSongs() {
    if (isLoadingSongs.value || (!artist.value?.name && !continuation.value)) return;
    isLoadingSongs.value = true;
    try {
      const data = await $fetch<PaginatedSongs>('/api/artist/songs', {
        query: {
          q: artist.value?.name,
          continuation: continuation.value || undefined
        }
      });
      if (data.items) {
        const newItems = data.items.filter((item) => {
          if (allSongs.value.some((existing) => existing.id === item.id)) return false;
          if (item.artistId === id || item.artists?.some((a) => a.id === id)) return true;
          if (
            item.artist &&
            artist.value?.name &&
            item.artist.toLowerCase().includes(artist.value.name.toLowerCase())
          ) {
            return true;
          }
          return false;
        });
        allSongs.value.push(...newItems);

        if (newItems.length === 0 && data.continuation && retryCount.value < 3) {
          continuation.value = data.continuation;
          retryCount.value++;
          setTimeout(() => {
            loadSongs();
          }, 50);
          return;
        }
        retryCount.value = 0;
      }
      continuation.value = data.continuation || null;
    } catch {
      // silent fail – songs section just won't render
    } finally {
      isLoadingSongs.value = false;
    }
  }

  function onPlayArtist() {
    if (!artist.value) return;

    const sourceSongs =
      artist.value.topSongs?.length > 0 ? artist.value.topSongs.slice(0, 10) : allSongs.value;
    if (sourceSongs.length === 0) return;

    if (
      isArtistPlaying.value ||
      (currentTrack.value &&
        sourceSongs.some((t: SearchResult) => t.id === currentTrack.value?.videoId))
    ) {
      togglePlay();
      return;
    }

    const queue: Track[] = sourceSongs.map((t: SearchResult) => ({
      videoId: t.id,
      title: t.title,
      artist: t.artist,
      artists: t.artists,
      artistId: t.artistId,
      thumbnailUrl: t.thumbnailUrl,
      durationSeconds: t.durationSeconds || 0
    }));

    playerStore.setQueue(queue);
    if (queue[0]) playTrack(queue[0]);
  }

  function onPlayTopSong(track: TrackListItem, index: number) {
    if (!artist.value?.topSongs) return;
    const tracksToPlay: Track[] = artist.value.topSongs.slice(0, 10).map((t: SearchResult) => ({
      videoId: t.id,
      title: t.title,
      artist: t.artist,
      artists: t.artists,
      artistId: t.artistId,
      thumbnailUrl: t.thumbnailUrl,
      durationSeconds: t.durationSeconds || 0
    }));
    const resolvedIndex = tracksToPlay.findIndex((t) => t.videoId === track.id);
    playQueue(tracksToPlay, resolvedIndex >= 0 ? resolvedIndex : index);
  }

  function onPlaySong(track: TrackListItem, index: number) {
    const tracksToPlay: Track[] = allSongs.value.map((t: SearchResult) => ({
      videoId: t.id,
      title: t.title,
      artist: t.artist,
      artists: t.artists,
      artistId: t.artistId,
      thumbnailUrl: t.thumbnailUrl,
      durationSeconds: t.durationSeconds || 0
    }));
    const resolvedIndex = allSongs.value.findIndex((t) => t.id === track.id);
    playQueue(tracksToPlay, resolvedIndex >= 0 ? resolvedIndex : index);
  }

  function onPlayAlbumSong(result: SearchResult) {
    playTrack({
      videoId: result.id,
      title: result.title,
      artist: result.artist,
      artists: result.artists,
      artistId: result.artistId,
      thumbnailUrl: result.thumbnailUrl,
      durationSeconds: result.durationSeconds || 0
    });
  }

  function onScroll(event: Event) {
    const el = event.target as HTMLElement;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      if (continuation.value && !isLoadingSongs.value) {
        loadSongs();
      }
    }
  }

  watch(
    artist,
    (newVal) => {
      if (newVal && allSongs.value.length === 0) {
        loadSongs();
      }
    },
    { immediate: true }
  );

  return {
    artist,
    status,
    error,
    allSongs,
    isLoadingSongs,
    isArtistPlaying,
    isArtistLoading,
    mappedTopSongs,
    mappedAllSongs,
    onPlayArtist,
    onPlayTopSong,
    onPlaySong,
    onPlayAlbumSong,
    onScroll
  };
}
