<script setup lang="ts">
defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'imported', id: string): void;
}>();

const store = usePlaylistsStore();

const url = ref('');
const isImporting = ref(false);

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

  isImporting.value = true;
  try {
    const created = await store.importPlaylist(url.value, platform.value);
    if (created) {
      url.value = '';
      emit('imported', created.id);
    }
  } finally {
    isImporting.value = false;
  }
}
</script>

<template>
  <AppModal
    :model-value="open"
    :title="$t('playlists.importPlaylist')"
    @update:model-value="!isImporting && emit('close')">
    <div class="import-modal__content">
      <div class="import-modal__fields">
        <div class="import-modal__field">
          <label class="import-modal__label">{{ $t('playlists.importUrlLabel') }}</label>
          <input
            v-model="url"
            type="url"
            class="import-modal__input"
            :placeholder="$t('playlists.importUrlPlaceholder')"
            :disabled="isImporting"
            @keyup.enter="handleImport" />
        </div>

        <div v-if="url && !isValidUrl" class="import-modal__hint">
          Please enter a valid Spotify or YouTube playlist URL.
        </div>
      </div>

      <div class="import-modal__actions">
        <button
          class="import-modal__button import-modal__button--secondary"
          :disabled="isImporting"
          @click="emit('close')">
          {{ $t('core.actions.cancel') }}
        </button>
        <button
          class="import-modal__button import-modal__button--primary"
          :disabled="!isValidUrl || isImporting"
          @click="handleImport">
          <AppSpinner v-if="isImporting" size="sm" />
          <span>
            <template v-if="isImporting">
              <template v-if="store.importProgress">
                {{ $t('playlists.importing') }} {{ store.importProgress.current }}/{{ store.importProgress.total }}
              </template>
              <template v-else>
                {{ $t('playlists.importing') }}...
              </template>
            </template>
            <template v-else>
              {{ $t('playlists.importPlaylist') }}
            </template>
          </span>
        </button>
      </div>
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

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__hint {
    font-size: var(--text-xs);
    color: #ff4d4d;
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

  &__spinner {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
