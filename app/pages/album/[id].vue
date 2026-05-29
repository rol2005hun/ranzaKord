<script setup lang="ts">
import type { AlbumDetail, SearchResult } from '@/features/search/types/search.types';
import type { Track } from '@/features/player/types/player.types';

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

function onPlayAlbum() {
  if (!album.value || album.value.tracks.length === 0) return;

  const queue: Track[] = album.value.tracks.map((t: SearchResult) => ({
    videoId: t.id,
    title: t.title,
    artist: t.artist,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: t.durationSeconds || 0
  }));

  playerStore.setQueue(queue);
  if (queue[0]) playTrack(queue[0]);
}
</script>

<template>
  <div class="album-page">
    <div v-if="status === 'pending'" class="album-page__loading">
      <div class="album-page__loading-header">
        <AppSkeleton width="232px" height="232px" border-radius="var(--radius-sm)" />
        <div class="album-page__loading-info">
          <AppSkeleton width="72px" height="12px" border-radius="var(--radius-sm)" />
          <AppSkeleton width="min(560px, 72vw)" height="88px" border-radius="var(--radius-md)" />
          <AppSkeleton width="min(420px, 58vw)" height="16px" border-radius="var(--radius-sm)" />
        </div>
      </div>

      <div class="album-page__loading-content">
        <AppSkeleton width="64px" height="64px" border-radius="50%" />
        <div class="album-page__loading-tracks">
          <AppSkeleton
            v-for="i in 8"
            :key="`album-loading-${i}`"
            height="58px"
            border-radius="var(--radius-md)" />
        </div>
      </div>
    </div>

    <div v-else-if="error || !album" class="album-page__error">
      <AppIcon name="ph:warning-circle" class="album-page__error-icon" />
      <p>{{ $t('search.album.loadError') }}</p>
    </div>

    <template v-else>
      <div class="album-page__header">
        <div
          class="album-page__header-bg"
          :style="
            album.thumbnailUrl
              ? `background-image: url('/api/image?url=${encodeURIComponent(album.thumbnailUrl)}')`
              : ''
          "></div>
        <div class="album-page__header-overlay"></div>
        <div class="album-page__header-content">
          <div class="album-page__cover">
            <img
              v-if="album.thumbnailUrl"
              :src="`/api/image?url=${encodeURIComponent(album.thumbnailUrl)}`"
              :alt="album.title" />
            <AppIcon v-else name="ph:music-notes" />
          </div>
          <div class="album-page__info">
            <div class="album-page__badge">{{ $t('search.album.badge') }}</div>
            <h1 class="album-page__title">{{ album.title }}</h1>
            <div class="album-page__meta">
              <span class="album-page__artist">{{ album.artist }}</span>
              <span v-if="album.year" class="album-page__year">• {{ album.year }}</span>
              <span class="album-page__tracks-count">
                {{ $t('search.album.trackCount', { count: album.tracks.length }) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="album-page__content">
        <div class="album-page__actions">
          <button class="album-page__play-btn" @click="onPlayAlbum">
            <AppIcon name="ph:play-fill" />
          </button>
        </div>

        <div v-if="album.tracks.length > 0" class="album-page__tracks">
          <div class="album-page__tracks-header">
            <div class="album-page__tracks-col-index">#</div>
            <div class="album-page__tracks-col-title">{{ $t('search.album.titleColumn') }}</div>
            <div class="album-page__tracks-col-time">
              <AppIcon name="ph:clock" />
            </div>
          </div>

          <div
            v-for="(track, index) in album.tracks"
            :key="track.id"
            class="album-page__track"
            @click="onPlaySong(track)">
            <div class="album-page__tracks-col-index">{{ index + 1 }}</div>
            <div class="album-page__tracks-col-title">
              <div class="album-page__track-name">{{ track.title }}</div>
              <div class="album-page__track-artist">
                <NuxtLink
                  v-if="track.artistId"
                  :to="`/artist/${track.artistId}`"
                  class="artist-link"
                  @click.stop>
                  {{ track.artist }}
                </NuxtLink>
                <span v-else>{{ track.artist }}</span>
              </div>
            </div>
            <div class="album-page__tracks-col-time">
              {{
                track.durationSeconds
                  ? Math.floor(track.durationSeconds / 60) +
                    ':' +
                    (track.durationSeconds % 60).toString().padStart(2, '0')
                  : '--:--'
              }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.album-page {
  padding: var(--space-8);
  padding-bottom: var(--space-12);

  &__loading,
  &__error {
    display: flex;
    flex-direction: column;
    color: var(--color-text-secondary);
  }

  &__loading {
    gap: var(--space-8);
    padding: var(--space-6) 0;
  }

  &__loading-header {
    display: flex;
    align-items: flex-end;
    gap: var(--space-6);
    padding: var(--space-8);
    min-height: 350px;
    border-radius: var(--radius-xl);
    background: linear-gradient(to bottom, var(--color-surface), transparent);

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: center;
      text-align: center;
      min-height: 280px;
      padding: var(--space-6);
    }
  }

  &__loading-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1;
    min-width: 0;
  }

  &__loading-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  &__loading-tracks {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
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
    margin: 0 0 var(--space-8);
    overflow: hidden;

    @media (max-width: 768px) {
      padding: var(--space-6) var(--space-4);
      height: auto;
      min-height: 280px;
    }

    &-bg {
      position: absolute;
      inset: -20px;
      background-size: cover;
      background-position: center;
      filter: blur(40px) brightness(0.6);
      z-index: 1;
    }

    &-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, var(--color-background) 100%);
      z-index: 2;
    }

    &-content {
      position: relative;
      z-index: 3;
      display: flex;
      align-items: flex-end;
      gap: var(--space-6);

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
        text-align: center;
        width: 100%;
        margin-top: var(--space-12);
      }
    }
  }

  &__cover {
    width: 232px;
    height: 232px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background-color: var(--color-surface-raised);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    color: var(--color-text-secondary);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 200px;
      height: 200px;
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
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-inverse);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  &__title {
    font-size: 4.5rem;
    font-weight: var(--font-weight-black);
    color: var(--color-text-inverse);
    line-height: 1.1;
    margin: 0 0 var(--space-2) 0;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;

    @media (max-width: 768px) {
      font-size: 2.5rem;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-text-inverse);
    font-weight: var(--font-weight-medium);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    opacity: 0.9;

    @media (max-width: 768px) {
      justify-content: center;
    }
  }

  &__artist {
    font-weight: var(--font-weight-bold);
  }

  &__content {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-8);

    @media (max-width: 768px) {
      padding: 0;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-2) 0;
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

  &__tracks {
    display: flex;
    flex-direction: column;
  }

  &__tracks-header {
    display: grid;
    grid-template-columns: 48px 1fr 60px;
    padding: var(--space-2) var(--space-4);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--space-4);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__track {
    display: grid;
    grid-template-columns: 48px 1fr 60px;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast);

    &:hover {
      background-color: var(--color-surface-hover);

      .album-page__tracks-col-index {
        color: var(--color-text-primary);
      }
    }
  }

  &__tracks-col-index {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    font-size: var(--text-base);
  }

  &__tracks-col-title {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }

  &__track-name {
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__track-artist {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tracks-col-time {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
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
