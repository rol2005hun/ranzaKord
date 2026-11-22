<script setup lang="ts">
import type { RecommendedRadio } from '../types/home.types';

interface Props {
  radio: RecommendedRadio;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'play', radio: RecommendedRadio): void;
}>();

const player = usePlayer();
const playerStore = usePlayerStore();

const isCurrentRadio = computed(() => {
  const ctx = playerStore.playbackContext;
  if (!ctx || ctx.type !== 'radio') return false;
  return ctx.name === props.radio.title || ctx.sourceId === props.radio.seedVideoId;
});

const isPlayingThisRadio = computed(() => {
  return isCurrentRadio.value && player.isPlaying.value;
});

function onCardClick() {
  if (isCurrentRadio.value) {
    player.togglePlay();
  } else {
    emit('play', props.radio);
  }
}
</script>

<template>
  <article
    class="home-radio-card"
    :class="{ 'home-radio-card--active': isCurrentRadio }"
    @click="onCardClick">
    <div class="home-radio-card__cover-wrap">
      <div class="home-radio-card__cover" :style="{ '--radio-accent': radio.color }">
        <img
          v-if="radio.thumbnailUrl"
          :src="radio.thumbnailUrl"
          :alt="radio.title"
          class="home-radio-card__img"
          loading="lazy"
          decoding="async" />
        <div v-else class="home-radio-card__placeholder">
          <AppIcon name="ph:broadcast-duotone" />
        </div>

        <div class="home-radio-card__badge-tag">
          <AppIcon name="ph:broadcast-fill" class="home-radio-card__badge-icon" />
          <span>{{ $t('home.radioBadge') }}</span>
        </div>

        <button
          class="home-radio-card__play-btn"
          :class="{ 'home-radio-card__play-btn--visible': isCurrentRadio }"
          :aria-label="$t('home.playRadio')"
          @click.stop="onCardClick">
          <AppSpinner v-if="isCurrentRadio && player.isLoading.value" size="sm" />
          <AppIcon v-else-if="isPlayingThisRadio" name="ph:pause-fill" />
          <AppIcon v-else name="ph:play-fill" />
        </button>
      </div>
    </div>

    <div class="home-radio-card__info">
      <h3 class="home-radio-card__title">{{ radio.title }}</h3>
      <p class="home-radio-card__subtitle">{{ radio.subtitle }}</p>
    </div>
  </article>
</template>

<style scoped lang="scss">
.home-radio-card {
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

    .home-radio-card__play-btn {
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

  &__badge-tag {
    position: absolute;
    top: var(--space-2);
    left: var(--space-2);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: var(--radius-full);
    font-size: 10px;
    font-weight: var(--font-weight-bold);
    color: #ffffff;
    letter-spacing: 0.08em;
  }

  &__badge-icon {
    font-size: 12px;
    color: var(--radio-accent, var(--color-primary));
  }

  &__play-btn {
    position: absolute;
    right: var(--space-3);
    bottom: var(--space-3);
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    background: var(--radio-accent, var(--color-primary));
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

  &__subtitle {
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
