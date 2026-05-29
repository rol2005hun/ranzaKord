<script setup lang="ts">
import type { ArtistDetail, SearchResult } from '@/features/search/types/search.types';
import type { Track } from '@/features/player/types/player.types';

definePageMeta({
  layout: 'music'
});

const route = useRoute();
const id = route.params.id as string;

const headers = useRequestHeaders(['cookie']);
const {
  data: artist,
  status,
  error
} = await useFetch<ArtistDetail>('/api/artist', {
  headers,
  query: { id },
  lazy: true
});

const playerStore = usePlayerStore();
const { playTrack } = usePlayer();

function onPlaySong(track: SearchResult): void {
  playTrack({
    videoId: track.id,
    title: track.title,
    artist: track.artist,
    artistId: track.artistId,
    thumbnailUrl: track.thumbnailUrl,
    durationSeconds: track.durationSeconds || 0
  });
}

function onPlayArtist(): void {
  if (!artist.value || artist.value.topSongs.length === 0) return;

  const queue: Track[] = artist.value.topSongs.map((t: SearchResult) => ({
    videoId: t.id,
    title: t.title,
    artist: t.artist,
    artistId: t.artistId,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: t.durationSeconds || 0
  }));

  playerStore.setQueue(queue);
  if (queue[0]) playTrack(queue[0]);
}
</script>

<template>
  <div class="artist-page">
    <AppMusicDetailView
      :is-loading="status === 'pending'"
      :is-error="!!error || (!artist && status !== 'pending')"
      :error-text="$t('search.artist.loadError')"
      :title="artist?.name"
      :badge="$t('search.artist.badge')"
      :image-url="artist?.thumbnailUrl"
      :rounded-image="true"
      :show-tracks="false">
      <template #fallback-icon>
        <AppIcon name="ph:user" />
      </template>

      <template #actions>
        <button
          class="artist-page__play-btn"
          :disabled="!artist || artist.topSongs.length === 0"
          @click="onPlayArtist">
          <AppIcon name="ph:play-fill" />
        </button>
      </template>

      <template #content>
        <template v-if="status === 'pending'">
          <div class="artist-page__section">
            <div class="skeleton-line skeleton-line--section-title"></div>
            <div class="artist-page__songs-list">
              <div v-for="i in 5" :key="`track-skel-${i}`" class="artist-page__track-skeleton">
                <div class="artist-page__track-info">
                  <div class="artist-page__track-thumb skeleton-box"></div>
                  <div class="artist-page__track-text">
                    <div class="skeleton-line skeleton-line--track-title"></div>
                    <div class="skeleton-line skeleton-line--artist"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="artist">
          <div v-if="artist.topSongs.length > 0" class="artist-page__section">
            <h2 class="artist-page__section-title">{{ $t('search.artist.topSongs') }}</h2>
            <div class="artist-page__songs-list">
              <SearchListItem
                v-for="song in artist.topSongs.slice(0, 5)"
                :key="song.id"
                :track="song"
                @click="onPlaySong(song)" />
            </div>
          </div>

          <div v-if="artist.albums.length > 0" class="artist-page__section">
            <h2 class="artist-page__section-title">{{ $t('search.artist.albums') }}</h2>
            <div class="artist-page__albums-grid">
              <TopResultCard
                v-for="album in artist.albums"
                :key="album.id"
                :result="album"
                @play="onPlaySong" />
            </div>
          </div>
        </template>
      </template>
    </AppMusicDetailView>
  </div>
</template>

<style lang="scss" scoped>
.artist-page {
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

    &:hover:not(:disabled) {
      transform: scale(1.05);
      background-color: var(--color-primary-hover);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
  }

  &__section-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-6);
    color: var(--color-text-primary);
  }

  &__songs-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__track-skeleton {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
  }

  &__track-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  &__track-thumb {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    background: var(--color-surface-hover);
    flex-shrink: 0;
  }

  &__track-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__albums-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-4);

    @media (min-width: 1024px) {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  .skeleton-box {
    background: var(--color-surface-raised);
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-line {
    background: var(--color-surface-raised);
    height: 12px;
    border-radius: var(--radius-sm);
    animation: pulse 1.5s infinite ease-in-out;
    margin-bottom: var(--space-2);

    &--section-title {
      width: 180px;
      height: 28px;
      margin-bottom: var(--space-6);
    }
    &--track-title {
      width: 140px;
      margin-bottom: 4px;
    }
    &--artist {
      width: 90px;
      height: 10px;
    }
  }

  @keyframes pulse {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 0.5;
    }
  }
}
</style>
