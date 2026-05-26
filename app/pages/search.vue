<script setup lang="ts">
import type { SearchResultItem } from '~~/server/api/search.get';

definePageMeta({
  layout: 'music'
});

const route = useRoute();
const query = computed(() => (route.query.q as string) || '');

const { data, status } = await useFetch<SearchResultItem[]>('/api/search', {
  query: { q: query },
  watch: [query],
  lazy: true
});

const player = usePlayer();

function onTrackClick(track: SearchResultItem) {
  player.playTrack(track);
}
</script>

<template>
  <div class="search-page">
    <div class="search-page__header">
      <h1 class="search-page__title">
        <span v-if="query">Search Results for "{{ query }}"</span>
        <span v-else>Search for Music</span>
      </h1>
    </div>

    <div v-if="status === 'pending'" class="search-page__loading">
      <AppSpinner size="lg" />
    </div>

    <div v-else-if="data && data.length > 0" class="search-page__results">
      <SearchListItem
        v-for="item in data"
        :key="item.videoId"
        :track="item"
        @click="onTrackClick(item)" />
    </div>

    <div v-else-if="query" class="search-page__empty">
      <AppIcon name="ph:magnifying-glass" class="search-page__empty-icon" />
      <p>No results found for "{{ query }}"</p>
      <span class="search-page__empty-sub">Try searching with different keywords</span>
    </div>

    <div v-else class="search-page__empty">
      <AppIcon name="ph:magnifying-glass" class="search-page__empty-icon" />
      <p>Enter a search term in the navbar above</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-page {
  padding: var(--space-6) var(--space-8);
  max-width: 1200px;
  margin: 0 auto;

  &__header {
    margin-bottom: var(--space-8);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  &__title {
    font-size: var(--text-3xl);
    font-weight: var(--font-weight-black);
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-12) 0;
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-16) 0;
    text-align: center;
    color: var(--color-text-primary);
    font-size: var(--text-lg);
    font-weight: var(--font-weight-medium);

    &-icon {
      font-size: 4rem;
      color: var(--color-text-secondary);
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    &-sub {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
      margin-top: var(--space-2);
      font-weight: var(--font-weight-normal);
    }
  }
}

@media (max-width: 768px) {
  .search-page {
    padding: var(--space-4);

    &__title {
      font-size: var(--text-2xl);
    }
  }
}
</style>
