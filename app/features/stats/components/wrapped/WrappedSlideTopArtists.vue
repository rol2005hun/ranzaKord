<script setup lang="ts">
import type { TopArtistAggregated } from '../../types/stats.types';

interface Props {
  artists: TopArtistAggregated[];
  artistImages: Record<string, string>;
}

defineProps<Props>();
</script>

<template>
  <div class="slide-top-artists">
    <div class="slide-top-artists__content">
      <p class="slide-top-artists__eyebrow">{{ $t('stats.wrapped.topArtists.eyebrow') }}</p>
      <h2 class="slide-top-artists__title">{{ $t('stats.wrapped.topArtists.title') }}</h2>
      <ul class="slide-top-artists__list">
        <li
          v-for="(artist, index) in artists.slice(0, 5)"
          :key="artist.name"
          class="slide-top-artists__item"
          :style="{ animationDelay: `${0.1 + index * 0.1}s` }">
          <span class="slide-top-artists__rank">#{{ index + 1 }}</span>
          <div class="slide-top-artists__avatar">
            <img
              v-if="artistImages[artist.name]"
              :src="artistImages[artist.name]"
              :alt="artist.name" />
            <AppIcon v-else name="ph:microphone-stage-fill" />
          </div>
          <span class="slide-top-artists__name">{{ artist.name }}</span>
          <span class="slide-top-artists__plays">{{ artist.playCount }}</span>
        </li>
      </ul>
    </div>
    <div class="slide-top-artists__bg" />
  </div>
</template>

<style scoped lang="scss">
.slide-top-artists {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(
    160deg,
    hsl(200, 60%, 8%) 0%,
    hsl(220, 50%, 10%) 50%,
    hsl(180, 60%, 7%) 100%
  );

  &__bg {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 80% 60% at 80% 50%,
      hsla(200, 80%, 50%, 0.07) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  &__content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 560px;
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
    color: hsl(200, 80%, 65%);
    margin: 0;
    animation: fadeInLeft 0.6s both;
  }

  &__title {
    font-size: clamp(1.5rem, 5vw, 2.5rem);
    font-weight: var(--font-weight-black);
    color: #fff;
    margin: 0;
    animation: fadeInLeft 0.6s 0.05s both;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: var(--radius-xl);
    padding: var(--space-3) var(--space-4);
    animation: fadeInLeft 0.6s both;
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.07);
    }

    &:first-child {
      background: hsla(200, 80%, 50%, 0.1);
      border-color: hsla(200, 80%, 50%, 0.2);
    }
  }

  &__rank {
    font-size: var(--text-base);
    font-weight: var(--font-weight-black);
    color: hsl(200, 80%, 65%);
    width: 36px;
    flex-shrink: 0;
    text-align: center;
  }

  &__avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsl(200, 80%, 65%);
    font-size: 1.2rem;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__name {
    flex: 1;
    font-size: var(--text-base);
    font-weight: var(--font-weight-semibold);
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  &__plays {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-bold);
    color: hsl(200, 80%, 65%);
    flex-shrink: 0;
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
