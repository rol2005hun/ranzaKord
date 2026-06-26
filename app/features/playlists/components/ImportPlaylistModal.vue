<script setup lang="ts">
import type { SkippedTrackEntry } from '../types/playlists.types';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'imported', id: string): void;
}>();

const store = usePlaylistsStore();
const { t } = useI18n();

const url = ref('');
const openList = ref<'success' | 'already' | 'skipped' | 'failed' | null>(null);
const skippedDetailTrack = ref<{
  entry: SkippedTrackEntry;
  type: 'skipped' | 'alreadyExists';
} | null>(null);
const lastImportedId = ref<string | null>(null);

const isImporting = computed(() => store.importProgress !== null);

const modalView = computed<'idle' | 'importing' | 'result' | 'skipped-detail'>(() => {
  if (skippedDetailTrack.value) return 'skipped-detail';
  if (store.importResult) return 'result';
  if (isImporting.value) return 'importing';
  return 'idle';
});

const modalTitle = computed(() => {
  if (modalView.value === 'result') return t('playlists.importComplete');
  if (modalView.value === 'importing') return t('playlists.importing');
  if (modalView.value === 'skipped-detail') {
    return skippedDetailTrack.value?.type === 'alreadyExists'
      ? t('playlists.importAlreadyExistsDetail')
      : t('playlists.importSkippedDetail');
  }
  return t('playlists.importPlaylist');
});

watch(
  () => store.importingUrl,
  (val) => {
    if (val) url.value = val;
  },
  { immediate: true }
);

const isValidUrl = computed(() => {
  try {
    new URL(url.value);
    return url.value.includes('spotify.com/playlist') || url.value.includes('youtube.com/playlist');
  } catch {
    return false;
  }
});

const platform = computed<'spotify' | 'youtube' | null>(() => {
  if (url.value.includes('spotify.com/playlist')) return 'spotify';
  if (url.value.includes('youtube.com/playlist')) return 'youtube';
  return null;
});

async function handleImport() {
  if (!isValidUrl.value || !platform.value) return;
  lastImportedId.value = null;
  const created = await store.importPlaylist(url.value, platform.value);
  if (created) {
    url.value = '';
    lastImportedId.value = created.id;
  }
}

function handleClose(): void {
  if (lastImportedId.value) {
    emit('imported', lastImportedId.value);
  }
  if (modalView.value !== 'importing') {
    lastImportedId.value = null;
    store.clearImportResult();
    openList.value = null;
    skippedDetailTrack.value = null;
    url.value = '';
  }
  emit('close');
}

function handleCancel(): void {
  store.cancelImport();
  emit('close');
}

function handleNewImport(): void {
  lastImportedId.value = null;
  store.clearImportResult();
  openList.value = null;
  skippedDetailTrack.value = null;
  url.value = '';
}

function toggleList(list: 'success' | 'already' | 'skipped' | 'failed') {
  openList.value = openList.value === list ? null : list;
}

function openSkippedDetail(entry: SkippedTrackEntry, type: 'skipped' | 'alreadyExists'): void {
  skippedDetailTrack.value = { entry, type };
}

function closeSkippedDetail(): void {
  skippedDetailTrack.value = null;
}
</script>

<template>
  <AppModal :model-value="open" :title="modalTitle" @update:model-value="handleClose">
    <div class="import-modal__content">
      <template v-if="modalView === 'skipped-detail' && skippedDetailTrack">
        <div class="import-modal__compare">
          <div class="import-modal__compare-side">
            <span class="import-modal__compare-label import-modal__compare-label--existing">
              {{ $t('playlists.importExisting') }}
            </span>
            <div class="import-modal__compare-track">
              <img
                v-if="skippedDetailTrack.entry.existing.thumbnailUrl"
                :src="skippedDetailTrack.entry.existing.thumbnailUrl"
                class="import-modal__compare-thumb"
                alt="" />
              <AppIcon
                v-else
                name="ph:music-notes-simple"
                class="import-modal__compare-thumb-placeholder" />
              <div class="import-modal__compare-meta">
                <span class="import-modal__compare-title">
                  {{ skippedDetailTrack.entry.existing.title }}
                </span>
                <span class="import-modal__compare-artist">
                  {{ skippedDetailTrack.entry.existing.artist }}
                </span>
                <a
                  v-if="skippedDetailTrack.entry.existing.videoId"
                  :href="'https://youtube.com/watch?v=' + skippedDetailTrack.entry.existing.videoId"
                  target="_blank"
                  class="import-modal__compare-id">
                  ID: {{ skippedDetailTrack.entry.existing.videoId }}
                </a>
              </div>
            </div>
          </div>

          <div class="import-modal__compare-divider">
            <AppIcon name="ph:equals" />
          </div>

          <div class="import-modal__compare-side">
            <span class="import-modal__compare-label import-modal__compare-label--incoming">
              {{ $t('playlists.importIncoming') }}
            </span>
            <div class="import-modal__compare-track">
              <img
                v-if="skippedDetailTrack.entry.incoming.thumbnailUrl"
                :src="skippedDetailTrack.entry.incoming.thumbnailUrl"
                class="import-modal__compare-thumb"
                alt="" />
              <AppIcon
                v-else
                name="ph:music-notes-simple"
                class="import-modal__compare-thumb-placeholder" />
              <div class="import-modal__compare-meta">
                <span class="import-modal__compare-title">
                  {{ skippedDetailTrack.entry.incoming.title }}
                </span>
                <span class="import-modal__compare-artist">
                  {{ skippedDetailTrack.entry.incoming.artist }}
                </span>
                <a
                  v-if="skippedDetailTrack.entry.incoming.videoId"
                  :href="'https://youtube.com/watch?v=' + skippedDetailTrack.entry.incoming.videoId"
                  target="_blank"
                  class="import-modal__compare-id">
                  ID: {{ skippedDetailTrack.entry.incoming.videoId }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="import-modal__actions">
          <button
            class="import-modal__button import-modal__button--secondary"
            @click="closeSkippedDetail">
            {{ $t('core.actions.back') }}
          </button>
        </div>
      </template>

      <template v-else-if="modalView === 'result' && store.importResult">
        <div class="import-modal__results">
          <!-- SUCCESS -->
          <div
            v-if="store.importResult.success > 0"
            class="import-modal__result-row import-modal__result-row--success import-modal__result-row--clickable"
            @click="toggleList('success')">
            <AppIcon name="ph:check-circle-fill" />
            <span>
              {{ $t('playlists.importSuccessCount', { count: store.importResult.success }) }}
            </span>
            <AppIcon
              class="import-modal__caret"
              :name="openList === 'success' ? 'ph:caret-up' : 'ph:caret-down'" />
          </div>
          <Transition name="failed-list">
            <div
              v-if="openList === 'success' && store.importResult.successTracks.length > 0"
              class="import-modal__failed-list">
              <div
                v-for="(track, idx) in store.importResult.successTracks"
                :key="'succ-' + idx"
                class="import-modal__failed-item">
                <img
                  v-if="track.thumbnailUrl"
                  :src="track.thumbnailUrl"
                  class="import-modal__failed-thumb"
                  alt="" />
                <AppIcon
                  v-else
                  name="ph:music-notes-simple"
                  class="import-modal__failed-thumb-placeholder" />
                <span class="import-modal__failed-title">{{ track.title }}</span>
                <span class="import-modal__failed-artist">{{ track.artist }}</span>
              </div>
            </div>
          </Transition>

          <!-- ALREADY EXISTS -->
          <div
            v-if="store.importResult.alreadyExists > 0"
            class="import-modal__result-row import-modal__result-row--already import-modal__result-row--clickable"
            @click="toggleList('already')">
            <AppIcon name="ph:copy-fill" />
            <span>
              {{
                $t('playlists.importAlreadyExistsCount', {
                  count: store.importResult.alreadyExists
                })
              }}
            </span>
            <AppIcon
              class="import-modal__caret"
              :name="openList === 'already' ? 'ph:caret-up' : 'ph:caret-down'" />
          </div>
          <Transition name="failed-list">
            <div
              v-if="openList === 'already' && store.importResult.alreadyExistsTracks.length > 0"
              class="import-modal__failed-list">
              <div
                v-for="(entry, idx) in store.importResult.alreadyExistsTracks"
                :key="'alr-' + idx"
                class="import-modal__failed-item import-modal__failed-item--clickable"
                @click="openSkippedDetail(entry, 'alreadyExists')">
                <img
                  v-if="entry.incoming.thumbnailUrl"
                  :src="entry.incoming.thumbnailUrl"
                  class="import-modal__failed-thumb"
                  alt="" />
                <AppIcon
                  v-else
                  name="ph:music-notes-simple"
                  class="import-modal__failed-thumb-placeholder" />
                <span class="import-modal__failed-title">{{ entry.incoming.title }}</span>
                <span class="import-modal__failed-artist">{{ entry.incoming.artist }}</span>
                <AppIcon name="ph:caret-right" class="import-modal__failed-chevron" />
              </div>
            </div>
          </Transition>

          <!-- SKIPPED (DUPLICATED) -->
          <div
            v-if="store.importResult.skipped > 0"
            class="import-modal__result-row import-modal__result-row--skipped import-modal__result-row--clickable"
            @click="toggleList('skipped')">
            <AppIcon name="ph:skip-forward-fill" />
            <span>
              {{ $t('playlists.importSkippedCount', { count: store.importResult.skipped }) }}
            </span>
            <AppIcon
              class="import-modal__caret"
              :name="openList === 'skipped' ? 'ph:caret-up' : 'ph:caret-down'" />
          </div>
          <Transition name="failed-list">
            <div
              v-if="openList === 'skipped' && store.importResult.skippedTracks.length > 0"
              class="import-modal__failed-list">
              <div
                v-for="(entry, idx) in store.importResult.skippedTracks"
                :key="'skip-' + idx"
                class="import-modal__failed-item import-modal__failed-item--clickable"
                @click="openSkippedDetail(entry, 'skipped')">
                <img
                  v-if="entry.incoming.thumbnailUrl"
                  :src="entry.incoming.thumbnailUrl"
                  class="import-modal__failed-thumb"
                  alt="" />
                <AppIcon
                  v-else
                  name="ph:music-notes-simple"
                  class="import-modal__failed-thumb-placeholder" />
                <span class="import-modal__failed-title">{{ entry.incoming.title }}</span>
                <span class="import-modal__failed-artist">{{ entry.incoming.artist }}</span>
                <AppIcon name="ph:caret-right" class="import-modal__failed-chevron" />
              </div>
            </div>
          </Transition>

          <!-- FAILED -->
          <div
            v-if="store.importResult.failed > 0"
            class="import-modal__result-row import-modal__result-row--failed import-modal__result-row--clickable"
            @click="toggleList('failed')">
            <AppIcon name="ph:x-circle-fill" />
            <span>
              {{ $t('playlists.importFailedCount', { count: store.importResult.failed }) }}
            </span>
            <AppIcon
              class="import-modal__caret"
              :name="openList === 'failed' ? 'ph:caret-up' : 'ph:caret-down'" />
          </div>
          <Transition name="failed-list">
            <div
              v-if="openList === 'failed' && store.importResult.failedTracks.length > 0"
              class="import-modal__failed-list">
              <div
                v-for="(track, idx) in store.importResult.failedTracks"
                :key="'fail-' + idx"
                class="import-modal__failed-item">
                <AppIcon
                  name="ph:music-notes-simple"
                  class="import-modal__failed-thumb-placeholder" />
                <span class="import-modal__failed-title">{{ track.title }}</span>
                <span class="import-modal__failed-artist">{{ track.artist }}</span>
              </div>
            </div>
          </Transition>
        </div>

        <div class="import-modal__actions">
          <button
            class="import-modal__button import-modal__button--secondary"
            @click="handleNewImport">
            {{ $t('playlists.importNewImport') }}
          </button>
          <button class="import-modal__button import-modal__button--primary" @click="handleClose">
            {{ $t('core.actions.close') }}
          </button>
        </div>
      </template>

      <template v-else-if="modalView === 'importing'">
        <div class="import-modal__progress-view">
          <AppSpinner size="md" />
          <div class="import-modal__progress-text">
            <template v-if="store.importProgress && store.importProgress.total > 0">
              {{ $t('playlists.importing') }} {{ store.importProgress.current }}/{{
                store.importProgress.total
              }}
            </template>
            <template v-else>{{ $t('playlists.importing') }}...</template>
          </div>
          <div v-if="store.importingUrl" class="import-modal__progress-url">
            {{ store.importingUrl }}
          </div>
        </div>

        <div class="import-modal__actions">
          <button
            class="import-modal__button import-modal__button--secondary"
            @click="handleCancel">
            {{ $t('core.actions.stop') }}
          </button>
        </div>
      </template>

      <template v-else>
        <div class="import-modal__fields">
          <div class="import-modal__field">
            <label class="import-modal__label" for="import-url">
              {{ $t('playlists.importUrlLabel') }}
            </label>
            <input
              id="import-url"
              v-model="url"
              type="url"
              class="import-modal__input"
              :placeholder="$t('playlists.importUrlPlaceholder')"
              @keyup.enter="handleImport" />
          </div>

          <div v-if="url && !isValidUrl" class="import-modal__hint">
            {{ $t('playlists.importInvalidUrl') }}
          </div>
        </div>

        <div class="import-modal__actions">
          <button class="import-modal__button import-modal__button--secondary" @click="handleClose">
            {{ $t('core.actions.cancel') }}
          </button>
          <button
            class="import-modal__button import-modal__button--primary"
            :disabled="!isValidUrl"
            @click="handleImport">
            {{ $t('playlists.importPlaylist') }}
          </button>
        </div>
      </template>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.import-modal {
  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  &__input {
    width: 100%;
    padding: var(--space-3);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: rgba(0, 0, 0, 0.2);
    color: var(--color-text-primary);
    font-size: var(--text-base);
    transition: all var(--transition-fast);

    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
    }
  }

  &__hint {
    font-size: var(--text-xs);
    color: hsl(0, 70%, 60%);
  }

  &__progress-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-6) 0;
  }

  &__progress-text {
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
  }

  &__progress-url {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    word-break: break-all;
    text-align: center;
    max-width: 100%;
  }

  &__results {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__result-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.04);

    &--success {
      color: hsl(140, 60%, 55%);
    }
    &--skipped {
      color: hsl(45, 80%, 60%);
    }
    &--failed {
      color: hsl(0, 70%, 60%);
    }

    &--clickable {
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }
    }
  }

  &__caret {
    margin-left: auto;
    opacity: 0.7;
  }

  &__failed-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 220px;
    overflow-y: auto;
    padding: var(--space-2);
    border-radius: var(--radius-md);
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--color-border);
  }

  &__failed-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);

    &--clickable {
      cursor: pointer;
      transition: background var(--transition-fast);

      &:hover {
        background: rgba(255, 255, 255, 0.06);
      }
    }
  }

  &__failed-thumb {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    flex-shrink: 0;
  }

  &__failed-thumb-placeholder {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    color: var(--color-text-secondary);
  }

  &__failed-title {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__failed-artist {
    color: var(--color-text-secondary);
    flex-shrink: 0;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__failed-chevron {
    color: var(--color-text-secondary);
    flex-shrink: 0;
    font-size: var(--text-sm);
  }

  &__compare {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: var(--space-4);
    align-items: center;
  }

  &__compare-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-xl);
    color: var(--color-text-secondary);
  }

  &__compare-side {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__compare-label {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;

    &--existing {
      color: hsl(140, 60%, 55%);
    }
    &--incoming {
      color: hsl(210, 80%, 65%);
    }
  }

  &__compare-track {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    padding: var(--space-3);
    background: rgba(255, 255, 255, 0.04);
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    min-height: 72px;
  }

  &__compare-thumb {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    flex-shrink: 0;
  }

  &__compare-thumb-placeholder {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    color: var(--color-text-secondary);
    font-size: var(--text-2xl);
  }

  &__compare-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__compare-title {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__compare-artist {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__compare-id {
    font-size: 0.65rem;
    color: var(--color-primary);
    text-decoration: none;
    font-family: monospace;
    opacity: 0.8;
    margin-top: 2px;

    &:hover {
      opacity: 1;
      text-decoration: underline;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-2);
  }

  &__button {
    padding: var(--space-2) var(--space-6);
    border-radius: var(--radius-full);
    font-weight: var(--font-weight-semibold);
    font-size: var(--text-sm);
    cursor: pointer;
    border: none;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    gap: var(--space-2);

    &--secondary {
      background: transparent;
      color: var(--color-text-secondary);

      &:hover:not(:disabled) {
        color: var(--color-text-primary);
      }
    }

    &--primary {
      background: var(--color-text-primary);
      color: var(--color-bg);

      &:hover:not(:disabled) {
        transform: scale(1.03);
        opacity: 0.9;
      }
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }
}

.failed-list-enter-active,
.failed-list-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.failed-list-enter-from,
.failed-list-leave-to {
  max-height: 0;
  opacity: 0;
  padding: 0;
}

.failed-list-enter-to,
.failed-list-leave-from {
  max-height: 220px;
  opacity: 1;
}
</style>
