<script setup lang="ts">
import type { AlbumDetail, SearchResult } from '@/features/search/types/search.types';
import type { Track } from '@/features/player/types/player.types';
import type { MusicTrack } from '@/features/playlists/types/playlists.types';

definePageMeta({
  layout: 'music'
});

const route = useRoute();
const id = route.params.id as string;

const headers = useRequestHeaders(['cookie']);
const {
  data: album,
  status,
  error
} = await useFetch<AlbumDetail>('/api/album', {
  headers,
  query: { id },
  lazy: true
});

const playerStore = usePlayerStore();
const player = usePlayer();
const { playTrack, togglePlay, isPlaying, currentTrack } = player;

const isAlbumPlaying = computed(() => {
  if (!album.value || album.value.tracks.length === 0) return false;
  if (!isPlaying.value) return false;
  return album.value.tracks.some((t: SearchResult) => t.id === currentTrack.value?.videoId);
});

const mappedTracks = computed<MusicTrack[]>(() => {
  if (!album.value) return [];
  return album.value.tracks.map((t: SearchResult) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    artistId: t.artistId,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: t.durationSeconds || 0,
    isPlaying: player.currentTrack.value?.videoId === t.id
  }));
});

function onPlaySong(track: MusicTrack): void {
  playTrack({
    videoId: track.id,
    title: track.title,
    artist: track.artist,
    artistId: track.artistId,
    thumbnailUrl: track.thumbnailUrl ?? '',
    durationSeconds: track.durationSeconds
  });
}

function onPlayAlbum(): void {
  if (!album.value || album.value.tracks.length === 0) return;

  if (
    isAlbumPlaying.value ||
    (currentTrack.value &&
      album.value.tracks.some((t: SearchResult) => t.id === currentTrack.value?.videoId))
  ) {
    togglePlay();
    return;
  }

  const queue: Track[] = album.value.tracks.map((t: SearchResult) => ({
    videoId: t.id,
    title: t.title,
    artist: t.artist,
    artistId: t.artistId,
    thumbnailUrl: t.thumbnailUrl || '',
    durationSeconds: t.durationSeconds || 0
  }));

  playerStore.setQueue(queue);
  if (queue[0]) playTrack(queue[0]);
}
</script>

<template>
  <div class="album-page">
    <AppMusicDetailView
      :is-loading="status === 'pending'"
      :is-error="!!error || (!album && status !== 'pending')"
      :error-text="$t('search.album.loadError')"
      :title="album?.title"
      :badge="$t('search.album.badge')"
      :image-url="album?.thumbnailUrl"
      :tracks="mappedTracks"
      :show-track-thumbnails="false"
      :is-list-playing="isAlbumPlaying"
      :disable-play-button="!album || album.tracks.length === 0"
      @play="onPlaySong"
      @play-all="onPlayAlbum">
      <template #meta>
        <span class="album-page__artist">{{ album?.artist }}</span>
        <span v-if="album?.year" class="album-page__year">• {{ album.year }}</span>
        <span class="album-page__tracks-count">
          {{ $t('search.album.trackCount', { count: album?.tracks.length || 0 }) }}
        </span>
      </template>
    </AppMusicDetailView>
  </div>
</template>

<style lang="scss" scoped>
.album-page {
  &__artist {
    font-weight: var(--font-weight-bold);
  }
}
</style>
