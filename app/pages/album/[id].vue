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
const { playTrack } = player;

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
      @play="onPlaySong">
      <template #meta>
        <span class="album-page__artist">{{ album?.artist }}</span>
        <span v-if="album?.year" class="album-page__year">• {{ album.year }}</span>
        <span class="album-page__tracks-count">
          {{ $t('search.album.trackCount', { count: album?.tracks.length || 0 }) }}
        </span>
      </template>

      <template #actions>
        <button class="album-page__play-btn" @click="onPlayAlbum">
          <AppIcon name="ph:play-fill" />
        </button>
      </template>
    </AppMusicDetailView>
  </div>
</template>

<style lang="scss" scoped>
.album-page {
  &__artist {
    font-weight: var(--font-weight-bold);
  }

  &__play-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--color-primary);
    color: var(--color-text-inverse);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    cursor: pointer;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    transition: all var(--transition-fast);

    &:hover {
      transform: scale(1.05);
      background-color: var(--color-primary-hover);
    }
  }
}
</style>
