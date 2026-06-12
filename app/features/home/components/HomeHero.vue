<script setup lang="ts">
import type { SearchResult } from '@/features/search/types/search.types';

const { currentUser } = useAuth();
const themeStore = useThemeStore();

const searchQuery = computed(() =>
  themeStore.themeId === 'wc2026' ? 'fifa world cup official songs' : 'top hits 2024'
);

const { data: featuredTracks, pending } = useLazyFetch<SearchResult[]>('/api/search', {
  query: { q: searchQuery, type: 'song' }
});

const recommendedTrack = computed(() => featuredTracks.value?.[0]);
const otherFeaturedTracks = computed(() => featuredTracks.value?.slice(1));

const { playQueue } = usePlayer();

function onPlayFromList(track: SearchResult) {
  if (!featuredTracks.value) return;
  const tracksToPlay = featuredTracks.value.map((t) => ({
    videoId: t.id,
    title: t.title,
    artist: t.artist,
    thumbnailUrl: t.thumbnailUrl,
    durationSeconds: t.durationSeconds || 0
  }));
  const index = tracksToPlay.findIndex((t) => t.videoId === track.id);
  playQueue(tracksToPlay, Math.max(0, index));
}
</script>

<template>
  <div class="home-dashboard">
    <section
      class="home-dashboard__hero"
      :class="{ 'home-dashboard__hero--wc2026': themeStore.themeId === 'wc2026' }">
      <div class="home-dashboard__hero-content">
        <i18n-t keypath="home.greeting" tag="p" class="home-dashboard__greeting">
          <template #name>
            <span class="home-dashboard__greeting-name">
              {{ currentUser?.name ?? $t('home.guest') }}
            </span>
          </template>
        </i18n-t>
        <h1 v-if="themeStore.themeId === 'wc2026'" class="home-dashboard__title">
          WC 2026 Anthems
        </h1>
        <h1 v-else class="home-dashboard__title">{{ $t('home.title') }}</h1>
        <p v-if="themeStore.themeId === 'wc2026'" class="home-dashboard__subtitle">
          Get ready for the tournament with the best hits!
        </p>
        <p v-else class="home-dashboard__subtitle">{{ $t('home.subtitle') }}</p>
      </div>
      <div class="home-dashboard__hero-visual">
        <div v-if="pending || !recommendedTrack" class="home-dashboard__skeleton-visual">
          <div class="skeleton skeleton--thumb" />
        </div>
        <TopResultCard
          v-else
          :result="recommendedTrack"
          class="home-dashboard__recommended-card"
          @play="onPlayFromList" />
      </div>
    </section>

    <section class="home-dashboard__section">
      <h2 class="home-dashboard__section-title">{{ $t('home.featured') }}</h2>

      <ClientOnly>
        <div v-if="pending" class="home-dashboard__grid">
          <div v-for="i in 8" :key="i" class="home-dashboard__skeleton">
            <div class="skeleton skeleton--thumb" />
            <div class="home-dashboard__skeleton-info">
              <div class="skeleton skeleton--title" />
              <div class="skeleton skeleton--artist" />
            </div>
          </div>
        </div>
        <div v-else class="home-dashboard__grid">
          <TrackCard
            v-for="track in otherFeaturedTracks"
            :key="track.id"
            :track="track"
            @play="onPlayFromList" />
        </div>

        <template #fallback>
          <div class="home-dashboard__grid">
            <div v-for="i in 8" :key="i" class="home-dashboard__skeleton">
              <div class="skeleton skeleton--thumb" />
              <div class="home-dashboard__skeleton-info">
                <div class="skeleton skeleton--title" />
                <div class="skeleton skeleton--artist" />
              </div>
            </div>
          </div>
        </template>
      </ClientOnly>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.home-dashboard {
  padding: var(--space-8) var(--space-8) var(--space-16);

  &__hero {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: var(--space-8);
    padding: var(--space-6) var(--space-8);
    border-radius: var(--radius-xl);
    background: var(
      --gradient-hero,
      linear-gradient(135deg, var(--color-surface) 0%, var(--color-bg) 100%)
    );
    border: 1px solid var(--color-border);
    overflow: hidden;
    margin-bottom: var(--space-10);

    &--wc2026 {
      background:
        linear-gradient(135deg, rgba(3, 20, 14, 0.9) 0%, rgba(10, 33, 25, 0.8) 100%),
        url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="%23ffffff22" stroke-width="2"/><line x1="50" y1="0" x2="50" y2="100" stroke="%23ffffff22" stroke-width="2"/><rect x="0" y="25" width="20" height="50" fill="none" stroke="%23ffffff22" stroke-width="2"/><rect x="80" y="25" width="20" height="50" fill="none" stroke="%23ffffff22" stroke-width="2"/></svg>')
          center/150px;
      border: 1px solid var(--color-primary);
      box-shadow: 0 0 20px rgba(74, 222, 128, 0.2);
    }
  }

  &__hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__greeting {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: var(--font-weight-medium);
  }

  &__title {
    font-size: var(--text-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    line-height: var(--leading-tight);
  }

  &__subtitle {
    font-size: var(--text-lg);
    color: var(--color-text-secondary);
    max-width: 400px;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-6);
    background: var(--color-primary-dark, #5b21b6);
    color: #ffffff;
    border-radius: var(--radius-full);
    text-decoration: none;
    font-weight: var(--font-weight-semibold);
    font-size: var(--text-base);
    transition:
      background var(--transition-fast),
      transform var(--transition-fast),
      box-shadow var(--transition-fast);
    width: fit-content;

    &:hover {
      background: var(--color-primary-hover);
      transform: translateY(-2px);
      box-shadow: var(--glow-primary, var(--shadow-lg));
    }
  }

  &__hero-visual {
    position: relative;
    width: 320px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__recommended-card {
    width: 100%;
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.4);
    transform: translateY(0);
    transition: transform var(--transition-normal);

    &:hover {
      transform: translateY(-4px);
    }
  }

  &__skeleton-visual {
    width: 100%;
    height: 120px;
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  &__section-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-6);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--space-4);
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
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

@media (max-width: 1024px) {
  .home-dashboard {
    padding: var(--space-6) var(--space-4) var(--space-10);

    &__hero {
      grid-template-columns: 1fr;
      text-align: center;
      gap: var(--space-6);
      padding: var(--space-6) var(--space-4);
    }

    &__hero-content {
      align-items: center;
    }

    &__subtitle {
      margin: 0 auto;
    }

    &__hero-visual {
      width: 100%;
      max-width: 320px;
      margin: 0 auto;
    }
  }
}
</style>
