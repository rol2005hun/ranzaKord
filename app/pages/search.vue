<script setup lang="ts">
import type { SearchResultType, SearchResult } from '@/features/search/types/search.types';

definePageMeta({
  layout: 'music'
});

const route = useRoute();
const { search, query, results, categorizedResults, searchType, isLoading, error } = useSearch();

const currentTab = ref<'all' | SearchResultType>('all');

watch(currentTab, (newTab) => {
  if (query.value) {
    search(query.value, newTab);
  }
});

watch(
  () => route.query.q,
  (newQ) => {
    if (newQ && typeof newQ === 'string' && newQ !== query.value) {
      search(newQ, currentTab.value, true);
    }
  }
);

onMounted(() => {
  const q = route.query.q as string;
  if (q && (q !== query.value || isLoading.value)) {
    nextTick(() => {
      search(q, currentTab.value, true);
    });
  }
});

const { playQueue } = usePlayer();

function onPlay(track: SearchResult) {
  let tracksToQueue: SearchResult[] = [];
  if (currentTab.value === 'all' && categorizedResults.value) {
    tracksToQueue = categorizedResults.value.songs || [];
  } else if (currentTab.value === 'video' || currentTab.value === 'song') {
    tracksToQueue = results.value;
  }

  if (tracksToQueue.length === 0) {
    tracksToQueue = [track];
  }

  const mappedQueue = tracksToQueue.map((r) => ({
    videoId: r.id,
    title: r.title,
    artist: r.artist,
    thumbnailUrl: r.thumbnailUrl,
    durationSeconds: r.durationSeconds || 0
  }));

  let startIndex = mappedQueue.findIndex((t) => t.videoId === track.id);

  if (startIndex === -1) {
    mappedQueue.unshift({
      videoId: track.id,
      title: track.title,
      artist: track.artist,
      thumbnailUrl: track.thumbnailUrl,
      durationSeconds: track.durationSeconds || 0
    });
    startIndex = 0;
  }

  playQueue(mappedQueue, startIndex);
}
</script>

<template>
  <div class="search-page">
    <div class="search-page__header">
      <h1 class="search-page__title">
        <span v-if="query">{{ $t('search.page.titleWithQuery', { query }) }}</span>
        <span v-else>{{ $t('search.page.title') }}</span>
      </h1>
      <SearchCategoryTabs v-if="query" v-model="currentTab" />
    </div>

    <div v-if="isLoading" class="search-page__loading-skeleton">
      <div v-if="searchType === 'all'" class="search-page__categorized">
        <div class="search-page__top-section">
          <div class="search-page__top-result-col">
            <AppSkeleton height="32px" width="150px" style="margin-bottom: var(--space-4)" />
            <AppSkeleton height="250px" border-radius="var(--radius-xl)" />
          </div>
          <div class="search-page__songs-col">
            <AppSkeleton height="32px" width="100px" style="margin-bottom: var(--space-4)" />
            <div class="search-page__list">
              <div
                v-for="i in 4"
                :key="i"
                style="
                  display: flex;
                  gap: var(--space-4);
                  align-items: center;
                  padding: var(--space-2) 0;
                ">
                <AppSkeleton width="48px" height="48px" border-radius="var(--radius-md)" />
                <div style="display: flex; flex-direction: column; gap: var(--space-2); flex: 1">
                  <AppSkeleton height="16px" width="60%" />
                  <AppSkeleton height="12px" width="40%" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="search-page__results">
        <div
          :class="
            searchType === 'song'
              ? 'search-page__list'
              : 'search-page__grid search-page__grid--large'
          ">
          <template v-if="searchType === 'song'">
            <div
              v-for="i in 8"
              :key="i"
              style="
                display: flex;
                gap: var(--space-4);
                align-items: center;
                padding: var(--space-2) 0;
              ">
              <AppSkeleton width="48px" height="48px" border-radius="var(--radius-md)" />
              <div style="display: flex; flex-direction: column; gap: var(--space-2); flex: 1">
                <AppSkeleton height="16px" width="40%" />
                <AppSkeleton height="12px" width="30%" />
              </div>
            </div>
          </template>
          <template v-else>
            <AppSkeleton v-for="i in 8" :key="i" height="250px" border-radius="var(--radius-xl)" />
          </template>
        </div>
      </div>
    </div>

    <div v-else-if="!query" class="search-page__empty">
      <AppIcon name="ph:magnifying-glass" class="search-page__empty-icon" />
      <p>{{ $t('search.page.emptyPrompt') }}</p>
    </div>

    <div v-else-if="error" class="search-page__empty">
      <AppIcon name="ph:warning-circle" class="search-page__empty-icon text-error" />
      <p>{{ error }}</p>
    </div>

    <div v-else-if="searchType === 'all' && categorizedResults" class="search-page__categorized">
      <!-- Top Result & Songs -->
      <div class="search-page__top-section">
        <div v-if="categorizedResults.topResult" class="search-page__top-result-col">
          <h2 class="search-page__section-title">{{ $t('search.page.topResult') }}</h2>
          <TopResultCard :result="categorizedResults.topResult" @play="onPlay" />
        </div>

        <div v-if="categorizedResults.songs.length > 0" class="search-page__songs-col">
          <h2 class="search-page__section-title">{{ $t('search.page.songs') }}</h2>
          <div class="search-page__list">
            <SearchListItem
              v-for="item in categorizedResults.songs"
              :key="item.id"
              :track="item"
              @click="onPlay(item)" />
          </div>
        </div>
      </div>

      <!-- Artists -->
      <div v-if="categorizedResults.artists.length > 0" class="search-page__section">
        <h2 class="search-page__section-title">{{ $t('search.page.artists') }}</h2>
        <div class="search-page__grid">
          <TopResultCard
            v-for="artist in categorizedResults.artists.slice(0, 5)"
            :key="artist.id"
            :result="artist"
            @play="onPlay" />
        </div>
      </div>

      <!-- Albums -->
      <div v-if="categorizedResults.albums.length > 0" class="search-page__section">
        <h2 class="search-page__section-title">{{ $t('search.page.albums') }}</h2>
        <div class="search-page__grid">
          <TopResultCard
            v-for="album in categorizedResults.albums.slice(0, 5)"
            :key="album.id"
            :result="album"
            @play="onPlay" />
        </div>
      </div>

      <div
        v-if="
          !categorizedResults.topResult &&
          categorizedResults.songs.length === 0 &&
          categorizedResults.artists.length === 0 &&
          categorizedResults.albums.length === 0
        "
        class="search-page__empty">
        <p>{{ $t('search.page.noResultsQuery', { query }) }}</p>
      </div>
    </div>

    <!-- Specific Category Results -->
    <div v-else-if="searchType !== 'all'" class="search-page__results">
      <div
        v-if="results.length > 0"
        :class="
          searchType === 'song' ? 'search-page__list' : 'search-page__grid search-page__grid--large'
        ">
        <template v-if="searchType === 'song'">
          <SearchListItem
            v-for="item in results"
            :key="item.id"
            :track="item"
            @click="onPlay(item)" />
        </template>
        <template v-else>
          <TopResultCard v-for="item in results" :key="item.id" :result="item" @play="onPlay" />
        </template>
      </div>
      <div v-else class="search-page__empty">
        <p>{{ $t('search.page.noResultsCategory', { query }) }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-page {
  padding: var(--space-6) var(--space-8);
  max-width: 1600px;
  margin: 0 auto;

  &__header {
    margin-bottom: var(--space-6);
  }

  &__title {
    font-size: var(--text-3xl);
    font-weight: var(--font-weight-black);
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
    margin-bottom: var(--space-6);
  }

  &__section-title {
    font-size: var(--text-xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-4);
    color: var(--color-text-primary);
  }

  &__loading-skeleton {
    padding: var(--space-4) 0;
  }

  &__top-section {
    display: grid;
    grid-template-columns: 400px 1fr;
    gap: var(--space-6);
    margin-bottom: var(--space-10);
  }

  &__section {
    margin-bottom: var(--space-10);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-4);

    &--large {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-16) 0;
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--text-lg);

    &-icon {
      font-size: 4rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }
  }
}

.text-error {
  color: hsl(0, 84%, 60%) !important;
  opacity: 1 !important;
}

@media (max-width: 1024px) {
  .search-page__top-section {
    grid-template-columns: 1fr;
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
