<script setup lang="ts">
import type { DailyMix } from '../types/home.types';

interface Props {
  mix: DailyMix;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'play', mix: DailyMix): void;
}>();

const player = usePlayer();

const isCurrentMix = computed(() => {
  return (
    player.currentTrack.value &&
    props.mix.tracks.some((t) => t.id === player.currentTrack.value?.videoId)
  );
});

const isPlayingThisMix = computed(() => {
  return isCurrentMix.value && player.isPlaying.value;
});

function onCardClick() {
  emit('play', props.mix);
}
</script>

<template>
  <article
    class="home-mix-card"
    :class="{ 'home-mix-card--active': isCurrentMix }"
    @click="onCardClick">
    <div class="home-mix-card__cover-wrap">
      <div class="home-mix-card__cover" :style="{ '--mix-accent': mix.color }">
        <img
          v-if="mix.thumbnailUrl"
          :src="mix.thumbnailUrl"
          :alt="mix.title"
          class="home-mix-card__img"
          loading="lazy"
          decoding="async" />
        <div v-else class="home-mix-card__placeholder">
          <AppIcon name="ph:music-notes-duotone" />
        </div>

        <div class="home-mix-card__brand-strip">
          <span class="home-mix-card__brand-tag">{{ mix.title }}</span>
        </div>

        <button
          class="home-mix-card__play-btn"
          :class="{ 'home-mix-card__play-btn--visible': isCurrentMix }"
          :aria-label="$t('home.playMix')"
          @click.stop="onCardClick">
          <AppSpinner v-if="isCurrentMix && player.isLoading.value" size="sm" />
          <AppIcon v-else-if="isPlayingThisMix" name="ph:pause-fill" />
          <AppIcon v-else name="ph:play-fill" />
        </button>
      </div>
    </div>

    <div class="home-mix-card__info">
      <h3 class="home-mix-card__title">{{ mix.title }}</h3>
      <p class="home-mix-card__artists">{{ mix.artistsSummary }}</p>
    </div>
  </article>
</template>

<style scoped lang="scss">
.home-mix-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast),
    border-color var(--transition-fast);

  &:hover {
    background: var(--color-surface-hover);
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
    border-color: var(--color-primary);

    .home-mix-card__play-btn {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &--active {
    border-color: var(--color-primary);
    background: var(--color-surface-hover);
  }

  &__cover-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    margin-bottom: var(--space-3);
  }

  &__cover {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-surface-raised);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-4xl);
    color: var(--color-text-muted);
  }

  &__brand-strip {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 32px;
    background: linear-gradient(
      to top,
      var(--mix-accent, var(--color-primary)) 0%,
      transparent 100%
    );
    display: flex;
    align-items: flex-end;
    padding: var(--space-2) var(--space-3);
  }

  &__brand-tag {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-bold);
    color: #ffffff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    letter-spacing: 0.05em;
  }

  &__play-btn {
    position: absolute;
    right: var(--space-3);
    bottom: var(--space-3);
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    background: var(--mix-accent, var(--color-primary));
    color: #ffffff;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: var(--text-lg);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4);
    opacity: 0;
    transform: translateY(8px);
    transition:
      opacity var(--transition-fast),
      transform var(--transition-fast),
      background var(--transition-fast);

    &:hover {
      transform: scale(1.08) !important;
      filter: brightness(1.1);
    }

    &--visible {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-height: 48px;
  }

  &__title {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artists {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    line-height: var(--leading-normal);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
