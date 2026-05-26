<script setup lang="ts">
import type { SearchResult } from '@/features/search/types/search.types';

const { currentUser } = useAuth();

const { data: featuredTracks, pending } = useLazyFetch<SearchResult[]>('/api/search', {
  query: { q: 'top hits 2024' },
  server: false
});
</script>

<template>
  <div class="home-dashboard">
    <section class="home-dashboard__hero">
      <div class="home-dashboard__hero-content">
        <p class="home-dashboard__greeting">
          {{ $t('home.greeting', { name: currentUser?.name ?? $t('home.guest') }) }}
        </p>
        <h1 class="home-dashboard__title">{{ $t('home.title') }}</h1>
        <p class="home-dashboard__subtitle">{{ $t('home.subtitle') }}</p>
      </div>
      <div class="home-dashboard__hero-visual">
        <div class="home-dashboard__orb home-dashboard__orb--1" />
        <div class="home-dashboard__orb home-dashboard__orb--2" />
        <div class="home-dashboard__orb home-dashboard__orb--3" />
        <AppIcon name="ph:music-notes-fill" class="home-dashboard__hero-icon" />
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
          <TrackCard v-for="track in featuredTracks" :key="track.videoId" :track="track" />
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
    padding: var(--space-12) var(--space-8);
    border-radius: var(--radius-xl);
    background: var(
      --gradient-hero,
      linear-gradient(135deg, var(--color-surface) 0%, var(--color-bg) 100%)
    );
    border: 1px solid var(--color-border);
    overflow: hidden;
    margin-bottom: var(--space-10);
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
    font-size: var(--text-4xl);
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
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__hero-icon {
    font-size: 7rem;
    color: var(--color-primary);
    opacity: 0.9;
    position: relative;
    z-index: 1;
    animation: float 4s ease-in-out infinite;
  }

  &__orb {
    position: absolute;
    border-radius: var(--radius-full);
    filter: blur(40px);
    opacity: 0.4;

    &--1 {
      width: 120px;
      height: 120px;
      background: var(--color-primary);
      top: 20px;
      left: 30px;
    }

    &--2 {
      width: 80px;
      height: 80px;
      background: var(--color-accent, var(--color-primary));
      bottom: 20px;
      right: 20px;
      opacity: 0.3;
    }

    &--3 {
      width: 60px;
      height: 60px;
      background: var(--color-primary-hover);
      top: 60px;
      right: 60px;
      opacity: 0.25;
    }
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
</style>
