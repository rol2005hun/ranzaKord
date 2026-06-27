<script setup lang="ts">
const player = usePlayer();
const layoutStore = useLayoutStore();
const { t } = useI18n();

const displayTrack = computed(() => player.currentTrack.value);

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
</script>

<template>
  <div v-if="layoutStore.isMiniPlayer" class="mini-player" data-tauri-drag-region>
    <div class="mini-player__artwork" data-tauri-drag-region>
      <img
        v-if="displayTrack?.thumbnailUrl"
        :src="displayTrack.thumbnailUrl"
        :alt="displayTrack?.title"
        data-tauri-drag-region />
      <AppIcon v-else name="ph:music-notes-simple" />
    </div>

    <div class="mini-player__body" data-tauri-drag-region>
      <div class="mini-player__meta" data-tauri-drag-region>
        <span class="mini-player__title">{{ displayTrack?.title ?? t('player.noTrack') }}</span>
        <span class="mini-player__artist">{{ displayTrack?.artist ?? '' }}</span>
      </div>

      <div class="mini-player__time" data-tauri-drag-region>
        <span>{{ formatTime(player.currentTimeSeconds.value) }}</span>
        <div class="mini-player__progress-bar">
          <div
            class="mini-player__progress-fill"
            :style="{
              width:
                player.durationSeconds.value > 0
                  ? `${(player.currentTimeSeconds.value / player.durationSeconds.value) * 100}%`
                  : '0%'
            }" />
        </div>
        <span>{{ formatTime(player.durationSeconds.value) }}</span>
      </div>

      <div class="mini-player__controls">
        <button
          class="mini-player__btn"
          :disabled="!player.hasPrev.value"
          :aria-label="t('player.prev')"
          @click="player.playPrev()">
          <AppIcon name="ph:skip-back-fill" />
        </button>

        <button
          class="mini-player__btn mini-player__btn--play"
          :disabled="!displayTrack"
          :aria-label="player.isPlaying.value ? t('player.pause') : t('player.play')"
          @click="player.togglePlay()">
          <AppSpinner v-if="player.isLoading.value" size="sm" />
          <AppIcon v-else-if="player.isPlaying.value" name="ph:pause-fill" />
          <AppIcon v-else name="ph:play-fill" />
        </button>

        <button
          class="mini-player__btn"
          :disabled="!player.hasNext.value"
          :aria-label="t('player.next')"
          @click="player.playNext()">
          <AppIcon name="ph:skip-forward-fill" />
        </button>
      </div>
    </div>

    <div class="mini-player__actions">
      <button
        class="mini-player__close"
        :aria-label="t('core.exitMiniPlayer')"
        @click="layoutStore.toggleMiniPlayer()">
        <AppIcon name="ph:arrow-square-out" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.mini-player {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  background: var(--color-surface);
  border-radius: 0;
  overflow: hidden;
  z-index: 99999;
  user-select: none;

  &__artwork {
    flex-shrink: 0;
    width: 120px;
    height: 100%;
    overflow: hidden;
    position: relative;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }

    .app-icon {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      color: var(--color-text-muted);
      background: var(--color-surface-hover);
    }
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--space-3) var(--space-2);
    gap: var(--space-2);
    min-width: 0;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__artist {
    font-size: 0.7rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__time {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 0.6rem;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  &__progress-bar {
    flex: 1;
    height: 3px;
    background: var(--color-border);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: var(--radius-full);
    transition: width 0.5s linear;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-full);
    font-size: 1rem;
    transition:
      color 0.15s,
      background 0.15s;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      color: var(--color-text-primary);
      background: var(--color-surface-hover);
    }

    &:disabled {
      opacity: 0.3;
      cursor: default;
    }

    &--play {
      width: 34px;
      height: 34px;
      font-size: 1.2rem;
      background: var(--color-primary);
      color: #fff;

      &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--color-primary) 85%, white);
        color: #fff;
      }
    }
  }

  &__actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: var(--space-2);
    flex-shrink: 0;
  }

  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    transition: color 0.15s;

    &:hover {
      color: var(--color-text-primary);
    }
  }
}
</style>
