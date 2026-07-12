<script setup lang="ts">
import type { TopTrackAggregated } from '../../types/stats.types';

interface Props {
  tracks: TopTrackAggregated[];
}

defineProps<Props>();
</script>

<template>
  <div class="slide-top-tracks">
    <div class="slide-top-tracks__bg" />
    <div class="slide-top-tracks__content">
      <p class="slide-top-tracks__eyebrow">{{ $t('stats.wrapped.topTracks.eyebrow') }}</p>
      <h2 class="slide-top-tracks__title">{{ $t('stats.wrapped.topTracks.title') }}</h2>
      <ul class="slide-top-tracks__list">
        <li
          v-for="(track, index) in tracks.slice(0, 5)"
          :key="track.trackId"
          class="slide-top-tracks__item"
          :style="{ animationDelay: `${0.05 + index * 0.1}s` }">
          <span class="slide-top-tracks__rank">#{{ index + 1 }}</span>
          <div class="slide-top-tracks__thumb">
            <img v-if="track.thumbnailUrl" :src="track.thumbnailUrl" :alt="track.title" />
            <AppIcon v-else name="ph:music-note-fill" />
          </div>
          <div class="slide-top-tracks__info">
            <span class="slide-top-tracks__name">{{ track.title }}</span>
            <span class="slide-top-tracks__artist">{{ track.artist }}</span>
          </div>
          <span class="slide-top-tracks__plays">{{ track.playCount }}×</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.slide-top-tracks {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(
    150deg,
    hsl(150, 50%, 7%) 0%,
    hsl(160, 40%, 9%) 50%,
    hsl(140, 50%, 7%) 100%
  );

  &__bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 70% 60% at 20% 50%,
      hsla(150, 70%, 40%, 0.07) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  &__content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 580px;
    padding: var(--space-8) var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  &__eyebrow {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: hsl(150, 70%, 55%);
    margin: 0;
    animation: slideInRight 0.6s both;
  }

  &__title {
    font-size: clamp(1.4rem, 5vw, 2.3rem);
    font-weight: var(--font-weight-black);
    color: #fff;
    margin: 0;
    animation: slideInRight 0.6s 0.05s both;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: var(--radius-xl);
    padding: var(--space-3) var(--space-4);
    animation: slideInRight 0.6s both;
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.07);
    }

    &:first-child {
      background: hsla(150, 70%, 40%, 0.1);
      border-color: hsla(150, 70%, 40%, 0.2);
    }
  }

  &__rank {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-black);
    color: hsl(150, 70%, 55%);
    width: 32px;
    flex-shrink: 0;
    text-align: center;
  }

  &__thumb {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsl(150, 70%, 55%);
    font-size: 1.1rem;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
  }

  &__name {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artist {
    font-size: var(--text-xs);
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__plays {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-bold);
    color: hsl(150, 70%, 55%);
    flex-shrink: 0;
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
