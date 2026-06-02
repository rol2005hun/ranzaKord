<script setup lang="ts">
import type { MusicTrack } from '@/features/playlists/types/playlists.types';

interface Props {
  isLoading?: boolean;
  isError?: boolean;
  errorText?: string;
  title?: string;
  badge?: string;
  imageUrl?: string | null;
  roundedImage?: boolean;
  tracks?: MusicTrack[];
  showTracks?: boolean;
  showTrackThumbnails?: boolean;
  skeletonTrackCount?: number;
  emptyText?: string;
  hasMoreTracks?: boolean;
  isLoadingMore?: boolean;
  showPlayButton?: boolean;
  isListPlaying?: boolean;
  disablePlayButton?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  isError: false,
  errorText: '',
  title: '',
  badge: '',
  imageUrl: null,
  roundedImage: false,
  tracks: () => [],
  showTracks: true,
  showTrackThumbnails: true,
  skeletonTrackCount: 5,
  emptyText: '',
  hasMoreTracks: false,
  isLoadingMore: false,
  showPlayButton: true,
  isListPlaying: false,
  disablePlayButton: false
});

const emit = defineEmits<{
  (e: 'play', track: MusicTrack, index: number): void;
  (e: 'load-more' | 'play-all'): void;
}>();

const loadMoreTrigger = ref<HTMLElement | null>(null);
let loadMoreObserver: IntersectionObserver | null = null;

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateObserver(): void {
  if (!import.meta.client) return;

  if (loadMoreObserver) {
    loadMoreObserver.disconnect();
    loadMoreObserver = null;
  }

  if (!loadMoreTrigger.value) return;

  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        emit('load-more');
      }
    },
    {
      rootMargin: '400px 0px'
    }
  );

  loadMoreObserver.observe(loadMoreTrigger.value);
}

onMounted(() => {
  nextTick(updateObserver);
});

watch(loadMoreTrigger, () => {
  nextTick(updateObserver);
});

onBeforeUnmount(() => {
  loadMoreObserver?.disconnect();
});
</script>

<template>
  <div class="music-detail">
    <div v-if="isLoading" class="music-detail__skeleton">
      <div class="music-detail__header music-detail__header--skeleton">
        <div class="music-detail__header-content">
          <div
            class="music-detail__cover skeleton-box"
            :class="{ 'music-detail__cover--rounded': roundedImage }"></div>
          <div class="music-detail__info">
            <div class="skeleton-line skeleton-line--badge"></div>
            <h1 class="skeleton-line skeleton-line--title"></h1>
            <div class="skeleton-line skeleton-line--meta"></div>
          </div>
        </div>
      </div>

      <div class="music-detail__content">
        <div class="music-detail__actions">
          <div class="skeleton-btn skeleton-btn--play"></div>
          <slot name="skeleton-actions"></slot>
        </div>

        <div v-if="showTracks" class="music-detail__tracks">
          <div class="music-detail__track-header">
            <div class="skeleton-line" style="width: 100%; margin: 0"></div>
          </div>
          <div
            v-for="i in skeletonTrackCount"
            :key="`track-skel-${i}`"
            class="music-detail__track"
            style="cursor: default">
            <div class="music-detail__track-num-wrapper">
              <div class="skeleton-line" style="width: 1rem; margin: 0"></div>
            </div>
            <div class="music-detail__track-info">
              <div v-if="showTrackThumbnails" class="music-detail__track-thumb skeleton-box"></div>
              <div class="music-detail__track-text">
                <div class="skeleton-line skeleton-line--track-title"></div>
                <div class="skeleton-line skeleton-line--artist" style="margin-bottom: 0"></div>
              </div>
            </div>
            <div class="music-detail__track-duration">
              <div class="skeleton-line" style="width: 2rem; margin: 0"></div>
            </div>
            <div class="music-detail__track-actions-slot"></div>
          </div>
        </div>
        <slot v-else name="content"></slot>
      </div>
    </div>

    <div v-else-if="isError" class="music-detail__error">
      <AppIcon name="ph:warning-circle" class="music-detail__error-icon" />
      <p>{{ errorText || $t('core.musicDetail.error') }}</p>
    </div>

    <template v-else>
      <div class="music-detail__header">
        <div
          class="music-detail__header-bg"
          :style="imageUrl ? `background-image: url('${imageUrl}')` : ''"></div>
        <div class="music-detail__header-overlay"></div>
        <div class="music-detail__header-content">
          <div
            class="music-detail__cover"
            :class="{ 'music-detail__cover--rounded': roundedImage }">
            <NuxtImg
              v-if="imageUrl"
              :src="imageUrl"
              :alt="title || 'Cover image'"
              width="160"
              height="160"
              format="webp"
              fetchpriority="high"
              preload />
            <slot v-else name="fallback-icon">
              <AppIcon name="ph:music-notes" />
            </slot>
          </div>
          <div class="music-detail__info">
            <div v-if="badge" class="music-detail__badge">{{ badge }}</div>
            <h1 class="music-detail__title">{{ title }}</h1>
            <div class="music-detail__meta">
              <slot name="meta"></slot>
            </div>
          </div>
        </div>
      </div>

      <div class="music-detail__content">
        <div class="music-detail__actions">
          <button
            v-if="showPlayButton"
            class="music-detail__play-btn"
            :disabled="disablePlayButton"
            :aria-label="$t('player.play')"
            @click="emit('play-all')">
            <AppIcon v-if="isListPlaying" name="ph:pause-fill" />
            <AppIcon v-else name="ph:play-fill" />
          </button>
          <slot name="actions"></slot>
        </div>

        <template v-if="showTracks">
          <div v-if="tracks.length === 0" class="music-detail__empty">
            <AppIcon name="ph:music-notes-plus" class="music-detail__empty-icon" />
            <p>{{ emptyText || $t('core.musicDetail.empty') }}</p>
          </div>

          <div v-else class="music-detail__tracks">
            <div class="music-detail__track-header">
              <div class="music-detail__track-col-index">#</div>
              <div class="music-detail__track-col-title">
                {{ $t('core.musicDetail.titleColumn') }}
              </div>
              <div class="music-detail__track-col-time">
                <AppIcon name="ph:clock" />
              </div>
              <div class="music-detail__track-col-action"></div>
            </div>

            <div
              v-for="(track, index) in tracks"
              :key="track.id"
              class="music-detail__track"
              @click="emit('play', track, index)">
              <div class="music-detail__track-num-wrapper">
                <ClientOnly>
                  <div style="display: contents">
                    <span
                      class="music-detail__track-num"
                      :class="{ 'music-detail__track-num--playing': track.isPlaying }">
                      <AppIcon
                        v-if="track.isPlaying"
                        name="ph:speaker-high-fill"
                        class="text-primary" />
                      <template v-else>{{ index + 1 }}</template>
                    </span>
                    <div class="music-detail__track-play">
                      <AppIcon :name="track.isPlaying ? 'ph:pause-fill' : 'ph:play-fill'" />
                    </div>
                  </div>
                  <template #fallback>
                    <span class="music-detail__track-num">{{ index + 1 }}</span>
                  </template>
                </ClientOnly>
              </div>

              <div class="music-detail__track-info">
                <div v-if="showTrackThumbnails" class="music-detail__track-thumb">
                  <img
                    v-if="track.thumbnailUrl"
                    :src="useApiUrl(`/api/image?url=${encodeURIComponent(track.thumbnailUrl)}`)"
                    :alt="track.title" />
                  <AppIcon v-else name="ph:music-note" />
                </div>
                <div class="music-detail__track-text">
                  <span class="music-detail__track-title">{{ track.title }}</span>
                  <div class="music-detail__track-artist">
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
              </div>

              <span class="music-detail__track-duration">
                {{ formatDuration(track.durationSeconds) }}
              </span>

              <div class="music-detail__track-actions-slot">
                <slot name="track-actions" :track="track"></slot>
              </div>
            </div>

            <div
              v-if="hasMoreTracks || isLoadingMore"
              ref="loadMoreTrigger"
              class="music-detail__load-more">
              <template v-if="isLoadingMore">
                <div
                  v-for="i in 3"
                  :key="`more-skel-${i}`"
                  class="music-detail__track"
                  style="cursor: default">
                  <div class="music-detail__track-num-wrapper">
                    <div class="skeleton-line" style="width: 1rem; margin: 0"></div>
                  </div>
                  <div class="music-detail__track-info">
                    <div
                      v-if="showTrackThumbnails"
                      class="music-detail__track-thumb skeleton-box"></div>
                    <div class="music-detail__track-text">
                      <div class="skeleton-line skeleton-line--track-title"></div>
                      <div
                        class="skeleton-line skeleton-line--artist"
                        style="margin-bottom: 0"></div>
                    </div>
                  </div>
                  <div class="music-detail__track-duration">
                    <div class="skeleton-line" style="width: 2rem; margin: 0"></div>
                  </div>
                  <div class="music-detail__track-actions-slot"></div>
                </div>
              </template>
            </div>
          </div>
        </template>

        <slot v-else name="content"></slot>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.music-detail {
  padding: var(--space-6);
  padding-bottom: var(--space-10);
  max-width: 1600px;
  margin: 0 auto;

  &__skeleton,
  &__error {
    display: flex;
    flex-direction: column;
    color: var(--color-text-secondary);
  }

  &__skeleton {
    gap: var(--space-8);
  }

  &__error {
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    gap: var(--space-4);
  }

  &__error-icon {
    font-size: 4rem;
    margin-bottom: var(--space-4);
  }

  &__header {
    position: relative;
    min-height: 220px;
    display: flex;
    align-items: center;
    padding: var(--space-6);
    margin: 0 0 var(--space-6);
    overflow: hidden;
    border-radius: var(--radius-xl);

    &--skeleton {
      background: linear-gradient(to bottom, var(--color-surface), transparent);
    }

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
      align-items: center;
      gap: var(--space-5);
      width: 100%;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-top: var(--space-6);
      }
    }
  }

  &__cover {
    width: 160px;
    height: 160px;
    border-radius: var(--radius-xl);
    overflow: hidden;
    background-color: var(--color-surface-raised);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    color: var(--color-text-secondary);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    flex-shrink: 0;

    &--rounded {
      border-radius: 50%;
    }

    @media (max-width: 768px) {
      width: 120px;
      height: 120px;
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
    flex: 1;
    min-width: 0;
  }

  &__badge {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-inverse);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__title {
    font-size: clamp(1.8rem, 4vw, 3rem);
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
    flex-wrap: wrap;

    @media (max-width: 768px) {
      justify-content: center;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-2) 0;
  }

  &__play-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background-color: var(--color-primary);
    color: #000;
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
      opacity: 0.4;
      cursor: not-allowed;
    }
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

  &__track-header {
    display: grid;
    grid-template-columns: 48px 1fr 60px 48px;
    align-items: center;
    padding: var(--space-2) var(--space-4);
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    border-bottom: 1px solid var(--color-border);
    margin-bottom: var(--space-4);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__track-col-index {
    display: flex;
    justify-content: center;
  }

  &__track-col-time {
    display: flex;
    justify-content: flex-end;
  }

  &__track {
    display: grid;
    grid-template-columns: 48px 1fr 60px 48px;
    align-items: center;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color var(--transition-fast);
    gap: var(--space-3);

    &:hover {
      background-color: var(--color-surface-hover);

      .music-detail__track-num {
        opacity: 0;
      }
      .music-detail__track-play {
        opacity: 1;
      }
    }
  }

  &__track-num-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__track-num {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--transition-fast);

    &--playing {
      color: var(--color-primary);
    }
  }

  &__track-play {
    position: absolute;
    opacity: 0;
    color: var(--color-text-primary);
    font-size: var(--text-base);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity var(--transition-fast);
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
    overflow: hidden;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__track-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 0;
  }

  &__track-title {
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

  &__track-duration {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-variant-numeric: tabular-nums;
  }

  &__track-actions-slot {
    display: flex;
    align-items: center;
    justify-content: center;
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

    &--badge {
      width: 60px;
      height: 14px;
      margin-bottom: var(--space-3);
    }
    &--title {
      width: min(400px, 70vw);
      height: 56px;
      margin-bottom: var(--space-3);
    }
    &--meta {
      width: 250px;
      height: 14px;
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

  .skeleton-btn {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    background: var(--color-surface-raised);
    animation: pulse 1.5s infinite ease-in-out;

    &--play {
      width: 56px;
      height: 56px;
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
