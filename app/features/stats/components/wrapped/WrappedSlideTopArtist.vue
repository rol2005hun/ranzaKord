<script setup lang="ts">
import type { TopArtistAggregated } from '../../types/stats.types';

interface Props {
  artist: TopArtistAggregated;
  artistImageUrl?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="slide-top-artist">
    <div class="slide-top-artist__bg-glow" />
    <div class="slide-top-artist__content">
      <p class="slide-top-artist__eyebrow">{{ $t('stats.wrapped.topArtist.eyebrow') }}</p>
      <div class="slide-top-artist__image-wrapper">
        <div class="slide-top-artist__image-ring" />
        <img
          v-if="artistImageUrl"
          :src="artistImageUrl"
          :alt="artist.name"
          class="slide-top-artist__image" />
        <div v-else class="slide-top-artist__image slide-top-artist__image--placeholder">
          <AppIcon name="ph:microphone-stage-fill" />
        </div>
      </div>
      <h2 class="slide-top-artist__name">{{ artist.name }}</h2>
      <div class="slide-top-artist__plays-badge">
        <AppIcon name="ph:play-fill" />
        <span>{{ artist.playCount }} {{ $t('stats.wrapped.topArtist.label') }}</span>
      </div>
    </div>
    <div class="slide-top-artist__sparkles">
      <span v-for="i in 12" :key="i" class="slide-top-artist__sparkle" :style="{ '--i': i }" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.slide-top-artist {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    hsl(20, 70%, 8%) 0%,
    hsl(340, 60%, 10%) 50%,
    hsl(10, 70%, 8%) 100%
  );

  &__bg-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 60% 50% at 50% 40%,
      hsla(20, 80%, 50%, 0.12) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  &__sparkles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__sparkle {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: hsl(40, 100%, 70%);
    left: calc(8% + var(--i) * 7%);
    top: calc(5% + var(--i) * 7%);
    animation: sparkle calc(2s + var(--i) * 0.15s) ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.1s);
    opacity: 0;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--space-8);
    gap: var(--space-6);
  }

  &__eyebrow {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: hsl(40, 100%, 70%);
    margin: 0;
    animation: fadeInUp 0.7s both;
  }

  &__image-wrapper {
    position: relative;
    animation: fadeInUp 0.7s 0.1s both;
  }

  &__image-ring {
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: conic-gradient(
      hsl(40, 100%, 70%),
      hsl(20, 100%, 60%),
      hsl(340, 100%, 60%),
      hsl(40, 100%, 70%)
    );
    animation: spin 4s linear infinite;
    z-index: 0;
  }

  &__image {
    position: relative;
    z-index: 1;
    width: clamp(140px, 25vmin, 220px);
    height: clamp(140px, 25vmin, 220px);
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid hsl(20, 30%, 10%);

    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: hsl(20, 30%, 15%);
      color: hsl(40, 100%, 70%);
      font-size: 4rem;
    }
  }

  &__name {
    font-size: clamp(2rem, 7vw, 4.5rem);
    font-weight: var(--font-weight-black);
    color: #fff;
    margin: 0;
    line-height: var(--leading-tight);
    text-shadow: 0 0 40px hsla(40, 100%, 70%, 0.3);
    animation: fadeInUp 0.7s 0.2s both;

    @media (max-width: 480px) {
      font-size: 2rem;
    }
  }

  &__plays-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background: hsla(40, 100%, 70%, 0.15);
    border: 1px solid hsla(40, 100%, 70%, 0.3);
    color: hsl(40, 100%, 75%);
    padding: var(--space-2) var(--space-5);
    border-radius: var(--radius-full);
    font-size: var(--text-base);
    font-weight: var(--font-weight-semibold);
    animation: fadeInUp 0.7s 0.3s both;
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
