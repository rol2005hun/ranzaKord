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
        <circle
          class="download-btn__ring-bg"
          cx="12"
          cy="12"
          r="9.5"
          fill="none"
          stroke-width="2.5" />
        <circle
          class="download-btn__ring-fill"
          :class="{ 'download-btn__ring-fill--indeterminate': progress <= 0 }"
          cx="12"
          cy="12"
          r="9.5"
          fill="none"
          stroke-width="2.5"
          :stroke-dasharray="progress > 0 ? `${(progress / 100) * 59.7} 59.7` : '18 41.7'"
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

    .download-btn__ring-svg {
      width: 28px;
      height: 28px;
    }
  }

  &--sm {
    width: 24px;
    height: 24px;
    font-size: 1rem;

    .download-btn__ring-svg {
      width: 22px;
      height: 22px;
    }
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
    position: absolute;
    overflow: visible;
  }

  &__ring-bg {
    stroke: color-mix(in srgb, var(--color-text-secondary) 30%, transparent);
  }

  &__ring-fill {
    stroke: var(--color-primary);
    transition: stroke-dasharray 0.25s ease;

    &--indeterminate {
      animation: spin-ring 1.2s linear infinite;
      transform-origin: 12px 12px;
    }
  }

  &__icon {
    font-size: inherit;

    &--small {
      font-size: 0.75rem;
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

@keyframes spin-ring {
  from {
    transform: rotate(-90deg);
  }
  to {
    transform: rotate(270deg);
  }
}
</style>
