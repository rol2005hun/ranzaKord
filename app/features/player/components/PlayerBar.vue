<script setup lang="ts">
const player = usePlayer();
const audioEl = ref<HTMLAudioElement | null>(null);

onMounted(() => {
  if (audioEl.value) {
    player.bindAudio(audioEl.value);
  }
});

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function onSeekInput(event: Event) {
  const input = event.target as HTMLInputElement;
  player.seek(parseFloat(input.value));
}

function onVolumeInput(event: Event) {
  const input = event.target as HTMLInputElement;
  player.setVolume(parseFloat(input.value));
}
</script>

<template>
  <div v-if="player.currentTrack.value" class="player-bar">
    <audio ref="audioEl" preload="metadata" />

    <div class="player-bar__track">
      <div class="player-bar__artwork">
        <img
          v-if="player.currentTrack.value.thumbnailUrl"
          :src="player.currentTrack.value.thumbnailUrl"
          :alt="player.currentTrack.value.title"
          class="player-bar__artwork-img" />
        <div v-else class="player-bar__artwork-placeholder">
          <AppIcon name="ph:music-note" />
        </div>
      </div>
      <div class="player-bar__info">
        <span class="player-bar__title">{{ player.currentTrack.value.title }}</span>
        <span class="player-bar__artist">{{ player.currentTrack.value.artist }}</span>
      </div>
    </div>

    <div class="player-bar__controls">
      <button
        class="player-bar__btn"
        :disabled="!player.hasPrev.value"
        :aria-label="$t('player.prev')"
        @click="player.playPrev()">
        <AppIcon name="ph:skip-back-fill" />
      </button>

      <button
        class="player-bar__btn player-bar__btn--play"
        :aria-label="player.isPlaying.value ? $t('player.pause') : $t('player.play')"
        @click="player.togglePlay()">
        <AppSpinner v-if="player.isLoading.value" size="sm" />
        <AppIcon v-else-if="player.isPlaying.value" name="ph:pause-fill" />
        <AppIcon v-else name="ph:play-fill" />
      </button>

      <button
        class="player-bar__btn"
        :disabled="!player.hasNext.value"
        :aria-label="$t('player.next')"
        @click="player.playNext()">
        <AppIcon name="ph:skip-forward-fill" />
      </button>
    </div>

    <div class="player-bar__progress">
      <span class="player-bar__time">{{ formatTime(player.currentTimeSeconds.value) }}</span>
      <input
        id="player-seek"
        class="player-bar__slider player-bar__slider--seek"
        type="range"
        min="0"
        :max="player.durationSeconds.value || 1"
        :value="player.currentTimeSeconds.value"
        step="1"
        :aria-label="$t('player.seek')"
        @input="onSeekInput" />
      <span class="player-bar__time">{{ formatTime(player.durationSeconds.value) }}</span>
    </div>

    <div class="player-bar__volume">
      <AppIcon name="ph:speaker-high" class="player-bar__volume-icon" />
      <input
        id="player-volume"
        class="player-bar__slider player-bar__slider--volume"
        type="range"
        min="0"
        max="1"
        :value="player.volume.value"
        step="0.01"
        :aria-label="$t('player.volume')"
        @input="onVolumeInput" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-player);
  height: var(--player-height);
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-6);
  background: var(--player-bg, var(--color-surface));
  border-top: 1px solid var(--player-border, var(--color-border));
  backdrop-filter: blur(20px);

  &__track {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
  }

  &__artwork {
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--color-surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__artwork-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__artwork-placeholder {
    font-size: var(--text-xl);
    color: var(--color-text-secondary);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artist {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-full);
    font-size: var(--text-xl);
    transition:
      color var(--transition-fast),
      transform var(--transition-fast);

    &:hover:not(:disabled) {
      color: var(--color-text-primary);
      transform: scale(1.1);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    &--play {
      width: 44px;
      height: 44px;
      font-size: var(--text-2xl);
      background: var(--color-primary);
      color: var(--color-primary-foreground);
      border-radius: var(--radius-full);

      &:hover:not(:disabled) {
        background: var(--color-primary-hover);
        color: var(--color-primary-foreground);
        transform: scale(1.05);
      }
    }
  }

  &__progress {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
  }

  &__time {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    font-variant-numeric: tabular-nums;
    min-width: 36px;
  }

  &__volume {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 140px;
  }

  &__volume-icon {
    color: var(--color-text-secondary);
    font-size: var(--text-base);
    flex-shrink: 0;
  }

  &__slider {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: var(--radius-full);
    background: var(--color-surface-hover);
    outline: none;
    cursor: pointer;
    transition: background var(--transition-fast);

    &--seek {
      flex: 1;
    }

    &--volume {
      flex: 1;
    }

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: var(--radius-full);
      background: var(--color-primary);
      cursor: pointer;
      transition: transform var(--transition-fast);

      &:hover {
        transform: scale(1.3);
      }
    }

    &:hover {
      background: var(--color-border-focus);
    }
  }
}
</style>
