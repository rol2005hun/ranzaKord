<script setup lang="ts">

const { results, isLoading, error, query } = useSearch();

const skeletonItems = Array.from({ length: 8 }, (_, i) => i);
</script>

<template>
  <div class="search-results">
    <div v-if="isLoading" class="search-results__grid">
      <div v-for="i in skeletonItems" :key="i" class="search-results__skeleton">
        <div class="skeleton skeleton--thumb" />
        <div class="search-results__skeleton-info">
          <div class="skeleton skeleton--title" />
          <div class="skeleton skeleton--artist" />
        </div>
      </div>
    </div>

    <div v-else-if="error" class="search-results__error">
      <AppIcon name="ph:warning-circle" />
      <p>{{ error }}</p>
    </div>

    <div v-else-if="results.length === 0 && query" class="search-results__empty">
      <AppIcon name="ph:music-note-slash" />
      <p>{{ $t('search.noResults', { query }) }}</p>
    </div>

    <div v-else class="search-results__grid">
      <TrackCard v-for="track in results" :key="track.videoId" :track="track" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-results {
  padding: var(--space-6) 0;

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-4);
  }

  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-16);
    color: var(--color-text-secondary);
    font-size: var(--text-lg);
    text-align: center;

    :deep(svg) {
      font-size: 3rem;
      opacity: 0.5;
    }
  }

  &__skeleton {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  &__skeleton-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3) var(--space-3);
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 25%,
    var(--color-surface-hover) 50%,
    var(--color-surface) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-sm);

  &--thumb {
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  &--title {
    height: 14px;
    width: 85%;
  }

  &--artist {
    height: 12px;
    width: 60%;
    opacity: 0.7;
  }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
