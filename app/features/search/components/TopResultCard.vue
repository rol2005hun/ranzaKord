<script setup lang="ts">
import type { SearchResult } from '../types/search.types';

interface Props {
  result: SearchResult;
}
const props = defineProps<Props>();

const isArtist = computed(() => props.result.type === 'artist');
const routeTo = computed(() => {
  if (props.result.type === 'artist') return `/artist/${props.result.id}`;
  if (props.result.type === 'album') return `/album/${props.result.id}`;
  return undefined;
});

const playerStore = usePlayerStore();
const isCurrentlyPlaying = computed(
  () => props.result.type === 'song' && playerStore.currentTrack?.videoId === props.result.id
);
const isPlaying = computed(() => isCurrentlyPlaying.value && playerStore.isPlaying);

const emit = defineEmits<{
  (e: 'play', result: SearchResult): void;
}>();
</script>

<template>
  <div class="top-result-card">
    <NuxtLink v-if="routeTo" :to="routeTo" class="top-result-card__inner">
      <div
        class="top-result-card__image-container"
        :class="{
          'top-result-card__image-container--artist': isArtist,
          'top-result-card__image-container--active': isCurrentlyPlaying
        }">
        <NuxtImg
          v-if="props.result.thumbnailUrl"
          :src="props.result.thumbnailUrl"
          :alt="props.result.title"
          width="92"
          height="92"
          format="webp"
          fetchpriority="high"
          preload />
        <AppIcon v-else name="ph:music-notes-simple" />
      </div>
      <div class="top-result-card__info">
        <h2 class="top-result-card__title" :class="{ 'text-primary': isCurrentlyPlaying }">
          <ClientOnly>
            <AppIcon
              v-if="isPlaying"
              name="ph:speaker-high-fill"
              style="margin-right: 4px; font-size: 1.1em; vertical-align: text-bottom" />
            <AppIcon
              v-else-if="isCurrentlyPlaying"
              name="ph:speaker-none-fill"
              style="margin-right: 4px; font-size: 1.1em; vertical-align: text-bottom" />
          </ClientOnly>
          {{ props.result.title }}
        </h2>
        <div class="top-result-card__meta">
          <span v-if="props.result.type !== 'artist'" class="top-result-card__artist">
            <NuxtLink
              v-if="props.result.artistId"
              :to="`/artist/${props.result.artistId}`"
              class="artist-link"
              @click.stop>
              {{ props.result.artist }}
            </NuxtLink>
            <span v-else>{{ props.result.artist }}</span>
          </span>
          <span class="top-result-card__badge">{{ props.result.type }}</span>
        </div>
      </div>
    </NuxtLink>

    <div v-else class="top-result-card__inner">
      <div
        class="top-result-card__image-container"
        :class="{
          'top-result-card__image-container--artist': isArtist,
          'top-result-card__image-container--active': isCurrentlyPlaying
        }">
        <NuxtImg
          v-if="props.result.thumbnailUrl"
          :src="props.result.thumbnailUrl"
          :alt="props.result.title"
          width="92"
          height="92"
          format="webp"
          fetchpriority="high"
          preload />
        <AppIcon v-else name="ph:music-notes-simple" />
      </div>
      <div class="top-result-card__info">
        <h2 class="top-result-card__title" :class="{ 'text-primary': isCurrentlyPlaying }">
          <ClientOnly>
            <AppIcon
              v-if="isPlaying"
              name="ph:speaker-high-fill"
              style="margin-right: 4px; font-size: 1.1em; vertical-align: text-bottom" />
            <AppIcon
              v-else-if="isCurrentlyPlaying"
              name="ph:speaker-none-fill"
              style="margin-right: 4px; font-size: 1.1em; vertical-align: text-bottom" />
          </ClientOnly>
          {{ props.result.title }}
        </h2>
        <div class="top-result-card__meta">
          <span v-if="props.result.type !== 'artist'" class="top-result-card__artist">
            <NuxtLink
              v-if="props.result.artistId"
              :to="`/artist/${props.result.artistId}`"
              class="artist-link"
              @click.stop>
              {{ props.result.artist }}
            </NuxtLink>
            <span v-else>{{ props.result.artist }}</span>
          </span>
          <span class="top-result-card__badge">{{ props.result.type }}</span>
        </div>
      </div>
      <button
        v-if="props.result.type === 'song'"
        class="top-result-card__play-btn"
        :aria-label="$t('player.play') || 'Lejátszás'"
        @click.prevent="emit('play', props.result)">
        <ClientOnly>
          <AppIcon v-if="isPlaying" name="ph:pause-fill" />
          <AppIcon v-else name="ph:play-fill" />
        </ClientOnly>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.top-result-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
  padding: var(--space-4);
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: var(--color-surface-hover);

    .top-result-card__play-btn {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &__inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    text-decoration: none;
    color: inherit;
    height: 100%;
  }

  &__image-container {
    width: 92px;
    height: 92px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background-color: var(--color-surface-raised);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: var(--color-text-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);

    &--artist {
      border-radius: 50%;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &--active {
      opacity: 0.6;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__title {
    font-size: 2rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.2;
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
  }

  &__artist {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  &__badge {
    background-color: var(--color-surface-raised);
    color: var(--color-text-primary);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.05em;
  }

  &__play-btn {
    position: absolute;
    bottom: var(--space-4);
    right: var(--space-4);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: var(--color-primary);
    color: var(--color-text-inverse);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    cursor: pointer;
    box-shadow: 0 8px 8px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05) !important;
      background-color: var(--color-primary-hover);
    }
  }
}

.text-primary {
  color: var(--color-primary) !important;
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
