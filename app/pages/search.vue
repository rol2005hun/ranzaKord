<script setup lang="ts">
import type { SearchResultItem } from '~~/server/api/search.get';

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
    <h1 class="search-page__title">Search Results for "{{ query }}"</h1>

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
    <div v-else class="search-page__empty">No results found.</div>
  </div>
</template>

<style lang="scss" scoped>
.search-page {
  padding: var(--space-6);

  &__title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-6);
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: var(--space-8) 0;
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__empty {
    text-align: center;
    color: var(--color-text-secondary);
    padding: var(--space-8) 0;
  }
}
</style>
