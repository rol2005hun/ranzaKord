<script setup lang="ts">
import type { TopTrackAggregated } from '../../types/stats.types';

interface Props {
  track: TopTrackAggregated;
}

defineProps<Props>();
</script>

<template>
  <div class="slide-top-track">
    <div class="slide-top-track__bg">
      <img
        v-if="track.thumbnailUrl"
        :src="track.thumbnailUrl"
        class="slide-top-track__bg-image"
        :alt="track.title" />
      <div class="slide-top-track__bg-overlay" />
    </div>
    <div class="slide-top-track__content">
      <p class="slide-top-track__eyebrow">{{ $t('stats.wrapped.topTrack.eyebrow') }}</p>
      <div class="slide-top-track__card">
        <div class="slide-top-track__art">
          <img
            v-if="track.thumbnailUrl"
            :src="track.thumbnailUrl"
            :alt="track.title"
            class="slide-top-track__art-img" />
          <div v-else class="slide-top-track__art-placeholder">
            <AppIcon name="ph:music-note-fill" />
          </div>
          <div class="slide-top-track__art-glow" />
        </div>
        <div class="slide-top-track__info">
          <h2 class="slide-top-track__title">{{ track.title }}</h2>
          <p class="slide-top-track__artist">{{ track.artist }}</p>
          <div class="slide-top-track__plays-badge">
            <AppIcon name="ph:repeat-fill" />
            <span>{{ track.playCount }} {{ $t('stats.wrapped.topTrack.label') }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="slide-top-track__vinyl">
      <span v-for="i in 8" :key="i" class="slide-top-track__vinyl-ring" :style="{ '--i': i }" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.slide-top-track {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &__bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  &__bg-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(40px) saturate(1.5);
    transform: scale(1.2);
    opacity: 0.3;
  }

  &__bg-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, hsl(280, 60%, 6%) 0%, hsla(300, 50%, 8%, 0.95) 100%);
  }

  &__vinyl {
    position: absolute;
    right: -120px;
    top: 50%;
    transform: translateY(-50%);
    width: 400px;
    height: 400px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    animation: vinyl-spin 8s linear infinite;
    opacity: 0.15;

    @media (max-width: 768px) {
      display: none;
    }
  }

  &__vinyl-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.4);
    width: calc(var(--i) * 50px);
    height: calc(var(--i) * 50px);
  }

  &__content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 600px;
    padding: var(--space-8) var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  &__eyebrow {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: hsl(280, 80%, 75%);
    margin: 0;
    animation: fadeInUp 0.6s both;
  }

  &__card {
    display: flex;
    gap: var(--space-6);
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.5rem;
    padding: var(--space-6);
    backdrop-filter: blur(20px);
    animation: fadeInUp 0.6s 0.1s both;

    @media (max-width: 540px) {
      flex-direction: column;
      text-align: center;
    }
  }

  &__art {
    position: relative;
    flex-shrink: 0;
  }

  &__art-img {
    width: clamp(100px, 20vmin, 160px);
    height: clamp(100px, 20vmin, 160px);
    border-radius: var(--radius-xl);
    object-fit: cover;
    position: relative;
    z-index: 1;
  }

  &__art-placeholder {
    width: clamp(100px, 20vmin, 160px);
    height: clamp(100px, 20vmin, 160px);
    border-radius: var(--radius-xl);
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsl(280, 80%, 75%);
    font-size: 3rem;
    position: relative;
    z-index: 1;
  }

  &__art-glow {
    position: absolute;
    inset: -10px;
    border-radius: calc(var(--radius-xl) + 10px);
    background: hsla(280, 80%, 60%, 0.25);
    filter: blur(15px);
    z-index: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 0;
  }

  &__title {
    font-size: clamp(1.3rem, 4vw, 2.2rem);
    font-weight: var(--font-weight-black);
    color: #fff;
    margin: 0;
    line-height: var(--leading-tight);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__artist {
    font-size: var(--text-base);
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }

  &__plays-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background: hsla(280, 80%, 60%, 0.15);
    border: 1px solid hsla(280, 80%, 60%, 0.3);
    color: hsl(280, 80%, 75%);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    align-self: flex-start;

    @media (max-width: 540px) {
      align-self: center;
    }
  }
}

@keyframes vinyl-spin {
  from {
    transform: translateY(-50%) rotate(0deg);
  }
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
