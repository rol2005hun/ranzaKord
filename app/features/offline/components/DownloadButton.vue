<script setup lang="ts">
import type { Track } from '@/features/player/types/player.types';

interface Props {
  track: Track;
  size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
});

const { t } = useI18n();
const offlineStore = useOfflineStore();

const status = computed(() => offlineStore.getStatus(props.track.videoId));
const isDownloaded = computed(() => offlineStore.isTrackDownloaded(props.track.videoId));
const progress = computed(() => offlineStore.getProgress(props.track.videoId));

async function handleClick(event: MouseEvent): Promise<void> {
  event.stopPropagation();
  if (status.value === 'downloading') return;
  if (isDownloaded.value) {
    await offlineStore.removeTrack(props.track.videoId);
  } else {
    await offlineStore.downloadTrack(props.track);
  }
}
</script>

<template>
  <button
    class="download-btn"
    :class="[
      `download-btn--${size}`,
      `download-btn--${status}`,
      { 'download-btn--done': isDownloaded }
    ]"
    :aria-label="isDownloaded ? t('offline.delete') : t('offline.download')"
    :title="isDownloaded ? t('offline.delete') : t('offline.download')"
    @click="handleClick">
    <span v-if="status === 'downloading'" class="download-btn__progress-ring">
      <svg viewBox="0 0 24 24" class="download-btn__ring-svg">
        <circle class="download-btn__ring-bg" cx="12" cy="12" r="9" fill="none" stroke-width="2" />
        <circle
          class="download-btn__ring-fill"
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke-width="2"
          :stroke-dasharray="`${(progress / 100) * 56.5} 56.5`"
          stroke-linecap="round"
          transform="rotate(-90 12 12)" />
      </svg>
      <AppIcon name="ph:arrow-down" class="download-btn__icon download-btn__icon--small" />
    </span>
    <AppIcon
      v-else-if="status === 'error'"
      name="ph:warning-circle"
      class="download-btn__icon download-btn__icon--error" />
    <AppIcon
      v-else-if="isDownloaded"
      name="ph:check-circle-duotone"
      class="download-btn__icon download-btn__icon--done" />
    <AppIcon v-else name="ph:arrow-circle-down-duotone" class="download-btn__icon" />
  </button>
</template>

<style scoped lang="scss">
.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-full);
  transition:
    background var(--transition-fast),
    transform var(--transition-fast),
    opacity var(--transition-fast);
  flex-shrink: 0;
  color: var(--color-text-secondary);

  &--md {
    width: 32px;
    height: 32px;
    font-size: 1.2rem;
  }

  &--sm {
    width: 24px;
    height: 24px;
    font-size: 1rem;
  }

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  &--done {
    color: var(--color-primary);

    &:hover {
      color: hsl(var(--color-error-h, 0), 70%, 55%);
    }
  }

  &--error {
    color: hsl(var(--color-error-h, 0), 70%, 55%);
  }

  &--downloading {
    cursor: default;
  }

  &__progress-ring {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__ring-svg {
    width: 20px;
    height: 20px;
    position: absolute;
  }

  &__ring-bg {
    stroke: var(--color-border);
  }

  &__ring-fill {
    stroke: var(--color-primary);
    transition: stroke-dasharray 0.2s ease;
  }

  &__icon {
    font-size: inherit;

    &--small {
      font-size: 0.7rem;
      position: relative;
      z-index: 1;
    }

    &--done {
      color: var(--color-primary);
    }

    &--error {
      color: hsl(var(--color-error-h, 0), 70%, 55%);
    }
  }
}
</style>
