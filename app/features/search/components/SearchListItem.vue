<script setup lang="ts">
import type { SearchResult } from '@/features/search/types/search.types';

const props = defineProps<{
  track: SearchResult;
}>();

const { playTrack } = usePlayer();

function onPlay() {
  playTrack(props.track);
}
</script>

<template>
  <div class="search-list-item" @click="onPlay">
    <div class="search-list-item__thumb">
      <img :src="`/api/image?url=${encodeURIComponent(track.thumbnailUrl)}`" :alt="track.title" />
      <div class="search-list-item__overlay">
        <AppIcon name="ph:play-fill" />
      </div>
    </div>

    <div class="search-list-item__info">
      <h3 class="search-list-item__title">{{ track.title }}</h3>
      <p class="search-list-item__subtitle">Videóklip • {{ track.artist }}</p>
    </div>

    <div class="search-list-item__actions">
      <button class="search-list-item__action" @click.stop>
        <AppIcon name="ph:dots-three-bold" />
      </button>
      <button class="search-list-item__action" @click.stop>
        <AppIcon name="ph:plus-circle" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--color-surface-hover);

    .search-list-item__overlay {
      opacity: 1;
    }
  }

  &__thumb {
    position: relative;
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--transition-fast);
    color: white;
    font-size: var(--text-xl);
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  &__title {
    margin: 0;
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__subtitle {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  &:hover &__actions {
    opacity: 1;
  }

  &__action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    border-radius: var(--radius-full);
    cursor: pointer;
    font-size: var(--text-lg);
    transition:
      color var(--transition-fast),
      background-color var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
      background-color: var(--color-surface-raised);
    }
  }
}

@media (max-width: 768px) {
  .search-list-item__actions {
    opacity: 1;
  }
}
</style>
