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
    <AppMusicPage
      :is-loading="status === 'pending'"
      :is-error="!!error || (!album && status !== 'pending')"
      :error-text="$t('search.album.loadError')"
      :title="album?.title"
      :badge="$t('search.album.badge')"
      :image-url="album?.thumbnailUrl"
      :is-list-playing="isAlbumPlaying"
      :disable-play-button="!album || album.tracks.length === 0"
      @play-all="onPlayAlbum">
      <template #meta>
        <span class="album-page__artist">{{ album?.artist }}</span>
        <span v-if="album?.year" class="album-page__year">• {{ album.year }}</span>
        <span class="album-page__tracks-count">
          {{ $t('search.album.trackCount', { count: album?.tracks.length || 0 }) }}
        </span>
      </template>

      <template #skeleton-tracks>
        <AppTrackList
          :is-loading="true"
          :columns="['index', 'title', 'time']"
          :show-thumbnails="false" />
      </template>

      <template #tracks>
        <div v-if="mappedTracks.length === 0 && status !== 'pending'" class="music-page__empty">
          <AppIcon name="ph:music-notes-plus" class="music-page__empty-icon" />
          <p>{{ $t('core.musicDetail.empty') }}</p>
          <NuxtLink to="/" class="music-page__empty-btn">
            {{ $t('playlists.discover') }}
          </NuxtLink>
        </div>

        <div v-else-if="mappedTracks.length > 0" class="album-page__tracks">
          <AppTrackList
            :tracks="mappedTracks"
            :columns="['index', 'title', 'time']"
            :show-thumbnails="false"
            @play="onPlaySong" />
        </div>
      </template>
    </AppMusicPage>
  </div>
</template>

<style lang="scss" scoped>
.album-page {
  height: 100%;

  &__artist {
    font-weight: var(--font-weight-bold);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-12) 0;
    gap: var(--space-3);
    color: var(--color-text-secondary);
  }

  &__empty-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  &__tracks {
    display: flex;
    flex-direction: column;
  }
}

.artist-link {
  color: inherit;
  text-decoration: none;
  transition: color var(--transition-fast);

  &:hover {
    text-decoration: underline;
    color: var(--color-text-primary);
  }
}
</style>
