<script setup lang="ts">
import type { AlbumDetail, SearchResult } from '@/features/search/types/search.types';
import type { Track } from '@/features/player/types/player.types';
import type { MusicTrack } from '@/features/playlists/types/playlists.types';

definePageMeta({
  layout: 'music'
});

const route = useRoute();
const id = route.params.id as string;
const { t } = useI18n();

const headers = useRequestHeaders(['cookie']);
const {
  data: album,
  status,
  error
} = await useFetch<AlbumDetail>('/api/album', {
  headers,
  query: { id },
  lazy: true,
  getCachedData(key) {
    const nuxtApp = useNuxtApp();
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  }
});

const playerStore = usePlayerStore();
const player = usePlayer();
const { playTrack, togglePlay, isPlaying, currentTrack } = player;

const isAlbumPlaying = computed(() => {
  if (
    playerStore.playbackContext?.type === 'album' &&
    playerStore.playbackContext?.sourceId === id
  ) {
    return isPlaying.value;
  }
  if (!album.value || album.value.tracks.length === 0) return false;
  if (!isPlaying.value) return false;
  return album.value.tracks.some((t: SearchResult) => t.id === currentTrack.value?.videoId);
});

const isAlbumLoading = computed(() => {
  if (
    playerStore.playbackContext?.type === 'album' &&
    playerStore.playbackContext?.sourceId === id
  ) {
    return playerStore.isLoading;
  }
  if (!album.value || album.value.tracks.length === 0) return false;
  if (!playerStore.isLoading) return false;
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

const searchQuery = ref('');
const debouncedSearch = ref('');
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal;
  }, 300);
});

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});

const filteredMappedTracks = computed(() => {
  if (!debouncedSearch.value) return mappedTracks.value;
  const q = debouncedSearch.value.toLowerCase();
  return mappedTracks.value.filter(
    (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
  );
});

function focusSearch() {
  setTimeout(() => {
    const searchInput = document.querySelector(
      '.album-page__search-input'
    ) as HTMLInputElement | null;
    if (searchInput) {
      searchInput.focus();
    }
  }, 100);
}

function onPlaySong(track: MusicTrack): void {
  playerStore.playbackContext = {
    type: 'album',
    sourceId: id,
    currentOffset: album.value?.tracks.length || 0,
    totalItems: album.value?.tracks.length || 0
  };
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

  if (isAlbumPlaying.value) {
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

  playerStore.playbackContext = {
    type: 'album',
    sourceId: id,
    currentOffset: queue.length,
    totalItems: queue.length
  };

  playerStore.setQueue(queue);
  if (queue[0]) playTrack(queue[0]);
}

function onShuffleAlbum(): void {
  if (!album.value || album.value.tracks.length === 0) return;

  const queue: Track[] = album.value.tracks
    .map((t: SearchResult) => ({
      videoId: t.id,
      title: t.title,
      artist: t.artist,
      artistId: t.artistId,
      thumbnailUrl: t.thumbnailUrl || '',
      durationSeconds: t.durationSeconds || 0
    }))
    .sort(() => Math.random() - 0.5);

  playerStore.playbackContext = {
    type: 'album',
    sourceId: id,
    currentOffset: queue.length,
    totalItems: queue.length
  };

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
      :is-list-loading="isAlbumLoading"
      :disable-play-button="!album || album.tracks.length === 0"
      @play-all="onPlayAlbum">
      <template #meta>
        <span class="album-page__artist">{{ album?.artist }}</span>
        <span v-if="album?.year" class="album-page__year">• {{ album.year }}</span>
        <span class="album-page__tracks-count">
          {{ t('search.album.trackCount', { count: album?.tracks.length || 0 }) }}
        </span>
      </template>

      <template #center-header>
        <div v-if="album && album.tracks.length > 0" class="album-page__search-bar">
          <AppIcon name="ph:magnifying-glass" class="album-page__search-icon" />
          <input
            id="album-search-input"
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.localPlaceholder')"
            :aria-label="t('search.localPlaceholder')"
            class="album-page__search-input" />
          <div class="album-page__search-actions">
            <button
              v-if="searchQuery"
              class="album-page__search-clear"
              :aria-label="t('search.clear')"
              @click="searchQuery = ''">
              <AppIcon name="ph:x" />
            </button>
          </div>
        </div>
      </template>

      <template #actions>
        <button
          class="album-page__action-btn album-page__action-btn--mobile-search"
          :title="t('search.localPlaceholder')"
          @click="focusSearch">
          <AppIcon name="ph:magnifying-glass" />
        </button>
        <button class="album-page__action-btn" :title="t('player.shuffle')" @click="onShuffleAlbum">
          <AppIcon name="ph:shuffle" />
        </button>
        <button
          class="album-page__action-btn"
          :title="t('player.offlineDownload')"
          @click="() => {}">
          <AppIcon name="ph:download-simple" />
        </button>
      </template>

      <template #skeleton-tracks>
        <AppTrackList
          :is-loading="true"
          :columns="['index', 'title', 'time']"
          :show-thumbnails="false" />
      </template>

      <template #tracks>
        <div v-if="debouncedSearch && filteredMappedTracks.length === 0" class="album-page__empty">
          <AppIcon name="ph:magnifying-glass" class="album-page__empty-icon" size="4rem" />
          <p>{{ t('search.page.noResultsQuery', { query: debouncedSearch }) }}</p>
        </div>

        <div
          v-else-if="filteredMappedTracks.length === 0 && status !== 'pending'"
          class="music-page__empty">
          <AppIcon name="ph:music-notes-plus" class="music-page__empty-icon" />
          <p>{{ $t('core.musicDetail.empty') }}</p>
          <NuxtLink to="/" class="music-page__empty-btn">
            {{ $t('playlists.discover') }}
          </NuxtLink>
        </div>

        <div v-else-if="filteredMappedTracks.length > 0" class="album-page__tracks">
          <AppTrackList
            :tracks="filteredMappedTracks"
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

  &__action-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: transparent;
    color: var(--color-text-secondary);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
    }

    &--mobile-search {
      display: none;
      @media (max-width: 768px) {
        display: flex;
      }
    }
  }

  &__search-bar {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 400px;
    z-index: 10;
  }

  &__search-icon {
    position: absolute;
    left: var(--space-4);
    color: var(--color-text-secondary);
    font-size: var(--text-lg);
    pointer-events: none;
    z-index: 2;
  }

  &__search-input {
    width: 100%;
    padding: var(--space-3) 2.5rem var(--space-3) calc(var(--space-4) + 1.5rem + var(--space-2));
    background: color-mix(in srgb, var(--color-surface-raised) 80%, transparent);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    font-size: var(--text-base);
    font-family: var(--font-sans);
    outline: none;
    transition:
      border-color var(--transition-fast),
      box-shadow var(--transition-fast),
      background-color var(--transition-fast);

    &::placeholder {
      color: var(--color-text-secondary);
    }

    &:focus {
      border-color: var(--color-border-focus);
      box-shadow: 0 0 0 3px var(--color-ring);
      background: var(--color-surface);
    }

    &::-webkit-search-cancel-button {
      display: none;
    }
  }

  &__search-actions {
    position: absolute;
    right: var(--space-2);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    z-index: 2;
  }

  &__search-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: var(--color-surface-hover);
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    transition:
      color var(--transition-fast),
      background var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-raised);
    }
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
