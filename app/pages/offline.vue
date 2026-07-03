<script setup lang="ts">
import type { OfflineTrack } from '@/features/offline/types/offline.types';

definePageMeta({
  layout: 'music'
});

const { t } = useI18n();
const offlineStore = useOfflineStore();
const player = usePlayer();
const showDeleteConfirm = ref(false);

onMounted(async () => {
  await offlineStore.init();
});

useHead({
  title: computed(() => t('offline.title'))
});

const totalSizeMb = computed(() => (offlineStore.totalSizeBytes / (1024 * 1024)).toFixed(1));

async function playTrack(track: OfflineTrack): Promise<void> {
  const objectUrl = await offlineStore.getObjectUrl(track.videoId);
  const trackData = {
    videoId: track.videoId,
    title: track.title,
    artist: track.artist,
    thumbnailUrl: track.thumbnailUrl,
    durationSeconds: track.durationSeconds
  };
  if (objectUrl) {
    player.playTrack(trackData);
  }
}

async function confirmDeleteAll(): Promise<void> {
  await offlineStore.removeAll();
  showDeleteConfirm.value = false;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <AppMusicPage>
    <template #header>
      <div class="offline-header">
        <div class="offline-header__info">
          <h1 class="offline-header__title">{{ t('offline.title') }}</h1>
          <p class="offline-header__subtitle">{{ t('offline.description') }}</p>
        </div>
        <div v-if="offlineStore.downloadedTracks.length > 0" class="offline-header__actions">
          <span class="offline-header__size">
            <AppIcon name="ph:database-duotone" />
            {{ totalSizeMb }} MB
          </span>
          <button class="offline-header__delete-btn" @click="showDeleteConfirm = true">
            <AppIcon name="ph:trash-duotone" />
            {{ t('offline.deleteAll') }}
          </button>
        </div>
      </div>
    </template>

    <div v-if="offlineStore.downloadedTracks.length === 0" class="offline-empty">
      <AppIcon name="ph:wifi-slash-duotone" class="offline-empty__icon" />
      <p class="offline-empty__title">{{ t('offline.empty') }}</p>
      <p class="offline-empty__hint">{{ t('offline.emptyHint') }}</p>
    </div>

    <div v-else class="offline-list">
      <div
        v-for="track in offlineStore.downloadedTracks"
        :key="track.videoId"
        class="offline-track"
        @click="playTrack(track)">
        <div class="offline-track__thumb">
          <NuxtImg
            v-if="track.thumbnailUrl"
            :src="track.thumbnailUrl"
            :alt="track.title"
            width="48"
            height="48"
            format="webp"
            loading="lazy" />
          <AppIcon v-else name="ph:music-note-duotone" />
        </div>
        <div class="offline-track__info">
          <span class="offline-track__title">{{ track.title }}</span>
          <span class="offline-track__artist">{{ track.artist }}</span>
        </div>
        <div class="offline-track__meta">
          <span class="offline-track__size">{{ formatSize(track.sizeBytes) }}</span>
          <span class="offline-track__date">{{ formatDate(track.downloadedAt) }}</span>
        </div>
        <button
          class="offline-track__delete"
          :aria-label="t('offline.delete')"
          @click.stop="offlineStore.removeTrack(track.videoId)">
          <AppIcon name="ph:trash-duotone" />
        </button>
      </div>
    </div>

    <AppModal
      v-if="showDeleteConfirm"
      :model-value="showDeleteConfirm"
      @update:model-value="showDeleteConfirm = $event">
      <template #title>{{ t('offline.deleteAll') }}</template>
      <p>{{ t('offline.deleteAllConfirm') }}</p>
      <template #actions>
        <button class="app-btn app-btn--ghost" @click="showDeleteConfirm = false">
          {{ t('core.cancel') }}
        </button>
        <button class="app-btn app-btn--danger" @click="confirmDeleteAll">
          {{ t('offline.deleteAll') }}
        </button>
      </template>
    </AppModal>
  </AppMusicPage>
</template>

<style scoped lang="scss">
.offline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;

  &__title {
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
    color: var(--color-text-primary);
  }

  &__subtitle {
    color: var(--color-text-secondary);
    margin: var(--space-1) 0 0;
    font-size: var(--text-sm);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__size {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }

  &__delete-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all var(--transition-fast);

    &:hover {
      border-color: hsl(0, 70%, 55%);
      color: hsl(0, 70%, 55%);
    }
  }
}

.offline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-4);
  text-align: center;
  gap: var(--space-3);

  &__icon {
    font-size: 4rem;
    color: var(--color-text-secondary);
    opacity: 0.4;
  }

  &__title {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  &__hint {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
    max-width: 320px;
  }
}

.offline-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.offline-track {
  display: grid;
  grid-template-columns: 48px 1fr auto 40px;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--color-surface-hover);

    .offline-track__delete {
      opacity: 1;
    }
  }

  &__thumb {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    overflow: hidden;
    background: var(--color-surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    font-size: 1.5rem;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    font-size: var(--text-sm);
    font-weight: 600;
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

  &__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }

  &__size {
    font-size: var(--text-xs);
    color: var(--color-primary);
    font-weight: 500;
  }

  &__date {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  &__delete {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--radius-full);
    color: var(--color-text-secondary);
    cursor: pointer;
    opacity: 0;
    transition: all var(--transition-fast);
    flex-shrink: 0;

    &:hover {
      background: var(--color-surface-hover);
      color: hsl(0, 70%, 55%);
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: 48px 1fr 40px;

    .offline-track__meta {
      display: none;
    }

    .offline-track__delete {
      opacity: 1;
    }
  }
}
</style>
