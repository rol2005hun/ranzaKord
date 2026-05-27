<script setup lang="ts">
import type { ArtistDetail, SearchResult } from '@/features/search/types/search.types';

definePageMeta({
  layout: 'music'
});

const route = useRoute();
const id = route.params.id as string;

const {
  data: artist,
  status,
  error
} = await useFetch<ArtistDetail>('/api/artist', {
  query: { id },
  lazy: true
});

const { playTrack } = usePlayer();

function onPlaySong(track: SearchResult) {
  playTrack({
    videoId: track.id,
    title: track.title,
    artist: track.artist,
    thumbnailUrl: track.thumbnailUrl,
    durationSeconds: track.durationSeconds || 0
  });
}
</script>

<template>
  <div class="artist-page">
    <div v-if="status === 'pending'" class="artist-page__loading">
      <AppSpinner size="lg" />
    </div>

    <div v-else-if="error || !artist" class="artist-page__error">
      <AppIcon name="ph:warning-circle" class="artist-page__error-icon" />
      <p>Nem sikerült betölteni az előadót.</p>
    </div>

    <template v-else>
      <div class="artist-page__header">
        <div
          class="artist-page__header-bg"
          :style="
            artist.thumbnailUrl
              ? `background-image: url('/api/image?url=${encodeURIComponent(artist.thumbnailUrl)}')`
              : ''
          "></div>
        <div class="artist-page__header-overlay"></div>
        <div class="artist-page__header-content">
          <div class="artist-page__avatar">
            <img
              v-if="artist.thumbnailUrl"
              :src="`/api/image?url=${encodeURIComponent(artist.thumbnailUrl)}`"
              :alt="artist.name" />
            <AppIcon v-else name="ph:user" />
          </div>
          <div class="artist-page__info">
            <div class="artist-page__badge">ELŐADÓ</div>
            <h1 class="artist-page__title">{{ artist.name }}</h1>
          </div>
        </div>
      </div>

      <div class="artist-page__content">
        <div v-if="artist.topSongs.length > 0" class="artist-page__section">
          <h2 class="artist-page__section-title">Legnépszerűbb dalok</h2>
          <div class="artist-page__songs-list">
            <SearchListItem
              v-for="song in artist.topSongs.slice(0, 5)"
              :key="song.id"
              :track="song"
              @click="onPlaySong(song)" />
          </div>
        </div>

        <div v-if="artist.albums.length > 0" class="artist-page__section">
          <h2 class="artist-page__section-title">Albumok</h2>
          <div class="artist-page__albums-grid">
            <TopResultCard
              v-for="album in artist.albums"
              :key="album.id"
              :result="album"
              @play="onPlaySong" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.artist-page {
  padding-bottom: var(--space-12);

  &__loading,
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-24) 0;
    color: var(--color-text-secondary);
  }

  &__error-icon {
    font-size: 4rem;
    margin-bottom: var(--space-4);
  }

  &__header {
    position: relative;
    height: 350px;
    display: flex;
    align-items: flex-end;
    padding: var(--space-8);
    margin: calc(var(--space-8) * -1) calc(var(--space-8) * -1) var(--space-8)
      calc(var(--space-8) * -1);
    overflow: hidden;

    @media (max-width: 768px) {
      margin: calc(var(--space-4) * -1) calc(var(--space-4) * -1) var(--space-8)
        calc(var(--space-4) * -1);
      padding: var(--space-6) var(--space-4);
      height: 280px;
    }

    &-bg {
      position: absolute;
      inset: -20px;
      background-size: cover;
      background-position: center;
      filter: blur(20px);
      z-index: 1;
    }

    &-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, var(--color-background) 100%);
      z-index: 2;
    }

    &-content {
      position: relative;
      z-index: 3;
      display: flex;
      align-items: flex-end;
      gap: var(--space-6);
    }
  }

  &__avatar {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    overflow: hidden;
    background-color: var(--color-surface-raised);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    color: var(--color-text-secondary);
    box-shadow: var(--shadow-xl);
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 140px;
      height: 140px;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__badge {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-inverse);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  &__title {
    font-size: 5rem;
    font-weight: var(--font-weight-black);
    color: var(--color-text-inverse);
    line-height: 1;
    margin: 0;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);

    @media (max-width: 768px) {
      font-size: 3rem;
    }
  }

  &__content {
    max-width: 1600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
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

  &__albums-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-4);

    @media (min-width: 1024px) {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }
}
</style>
