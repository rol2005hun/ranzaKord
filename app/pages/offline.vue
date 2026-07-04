<script setup lang="ts">
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

async function playTrackFromList(trackItem: {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl?: string | null;
  durationSeconds: number;
}): Promise<void> {
  const objectUrl = await offlineStore.getObjectUrl(trackItem.id);
  const trackData = {
    videoId: trackItem.id,
    title: trackItem.title,
    artist: trackItem.artist,
    thumbnailUrl: trackItem.thumbnailUrl || '',
    durationSeconds: trackItem.durationSeconds
  };
  if (objectUrl) {
    player.playTrack(trackData);
  }
}

function removeTrackFromList(trackItem: { id: string }): void {
  offlineStore.removeTrack(trackItem.id);
}

const mappedTracks = computed(() => {
  return offlineStore.downloadedTracks.map((track) => ({
    id: track.videoId,
    title: track.title,
    artist: track.artist,
    thumbnailUrl: track.thumbnailUrl,
    durationSeconds: track.durationSeconds,
    addedAt: track.downloadedAt
  }));
});

async function confirmDeleteAll(): Promise<void> {
  await offlineStore.removeAll();
  showDeleteConfirm.value = false;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <AppMusicPage :title="t('offline.title')" :show-play-button="false">
    <template #fallback-icon>
      <AppIcon name="ph:wifi-slash-duotone" />
    </template>

    <template #meta>
      <span class="offline-header__size">
        <AppIcon name="ph:database-duotone" />
        {{ totalSizeMb }} MB
      </span>
    </template>

    <template #actions>
      <button
        v-if="offlineStore.downloadedTracks.length > 0"
        class="offline-header__delete-btn"
        @click="showDeleteConfirm = true">
        <AppIcon name="ph:trash-duotone" />
        {{ t('offline.deleteAll') }}
      </button>
    </template>

    <template #tracks>
      <div class="offline-content">
        <div v-if="offlineStore.storageQuotaBytes > 0" class="offline-storage">
          <div class="offline-storage__info">
            <span class="offline-storage__used">
              {{ t('offline.storageUsed', { size: formatSize(offlineStore.totalSizeBytes) }) }}
            </span>
            <span class="offline-storage__quota">
              {{ formatSize(offlineStore.storageQuotaBytes) }} MAX
            </span>
          </div>
          <div class="offline-storage__bar">
            <div
              class="offline-storage__fill"
              :style="{
                width: `${Math.min(100, (offlineStore.totalSizeBytes / offlineStore.storageQuotaBytes) * 100)}%`
              }"></div>
          </div>
        </div>

        <div v-if="offlineStore.downloadedTracks.length === 0" class="offline-empty">
          <AppIcon name="ph:wifi-slash-duotone" class="offline-empty__icon" />
          <p class="offline-empty__title">{{ t('offline.empty') }}</p>
          <p class="offline-empty__hint">{{ t('offline.emptyHint') }}</p>
        </div>

        <AppTrackList
          v-else
          class="offline-track-list"
          :tracks="mappedTracks"
          :columns="['index', 'title', 'date', 'time', 'action']"
          :show-thumbnails="true"
          @play="playTrackFromList"
          @remove="removeTrackFromList" />
      </div>
    </template>

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
.offline-content {
  padding: 0 var(--space-6);
  padding-bottom: var(--space-8);
}

.offline-header__size {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.offline-header__delete-btn {
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
.offline-storage {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-6);

  &__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
    font-size: var(--text-sm);
  }

  &__used {
    color: var(--color-text-primary);
    font-weight: 500;
  }

  &__quota {
    color: var(--color-text-secondary);
    font-size: var(--text-xs);
  }

  &__bar {
    width: 100%;
    height: 8px;
    background: var(--color-surface-hover);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), hsl(var(--color-primary-h), 80%, 65%));
    border-radius: var(--radius-full);
    transition: width 0.3s ease;
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

.offline-track-list {
  margin-top: var(--space-4);
}
</style>
