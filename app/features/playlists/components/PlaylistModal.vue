<script setup lang="ts">
import type { CreatePlaylistPayload } from '../types/playlists.types';

interface Props {
  open: boolean;
  editId?: string;
  initialName?: string;
  initialDescription?: string;
  initialImageUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  editId: undefined,
  initialName: '',
  initialDescription: '',
  initialImageUrl: ''
});

const emit = defineEmits<{
  close: [];
  created: [id: string];
}>();

const store = usePlaylistsStore();

const name = ref(props.initialName);
const description = ref(props.initialDescription);
const imageUrl = ref(props.initialImageUrl);
const imagePreview = ref(props.initialImageUrl);
const isUploading = ref(false);
const isSaving = ref(false);

watch(
  () => props.open,
  (val) => {
    if (val) {
      name.value = props.initialName;
      description.value = props.initialDescription;
      imageUrl.value = props.initialImageUrl;
      imagePreview.value = props.initialImageUrl;
    }
  }
);

async function onFileChange(e: Event): Promise<void> {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const base64 = ev.target?.result as string;
    imagePreview.value = base64;
    isUploading.value = true;
    try {
      const result = await $fetch<{ url: string }>('/api/upload/image', {
        method: 'POST',
        body: { image: base64 }
      });
      imageUrl.value = result.url;
    } catch {
      imagePreview.value = imageUrl.value;
    } finally {
      isUploading.value = false;
    }
  };
  reader.readAsDataURL(file);
}

async function submit(): Promise<void> {
  if (!name.value.trim()) return;
  isSaving.value = true;
  try {
    const payload: CreatePlaylistPayload = {
      name: name.value,
      description: description.value,
      imageUrl: imageUrl.value
    };

    if (props.editId) {
      await store.update(props.editId, payload);
      emit('close');
    } else {
      const created = await store.create(payload);
      if (created) emit('created', created.id);
    }
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <AppModal
    :model-value="open"
    :title="editId ? $t('playlists.editPlaylist') : $t('playlists.createPlaylist')"
    @update:model-value="
      (val) => {
        if (!val) emit('close');
      }
    ">
    <div class="playlist-modal__image-section">
      <label class="playlist-modal__image-label" for="playlist-image-upload">
        <div class="playlist-modal__image-preview">
          <img
            v-if="imagePreview"
            :src="imagePreview"
            alt="Cover"
            class="playlist-modal__image-img" />
          <div v-else class="playlist-modal__image-placeholder">
            <AppIcon name="ph:music-notes-fill" />
          </div>
          <div
            class="playlist-modal__image-overlay"
            :style="isUploading ? 'pointer-events: none' : ''">
            <AppSpinner v-if="isUploading" size="sm" />
            <AppIcon v-else name="ph:pencil-simple-fill" />
            <span class="playlist-modal__upload-text">
              {{ imagePreview ? $t('playlists.changeImage') : $t('playlists.uploadImage') }}
            </span>
          </div>
        </div>
        <input
          id="playlist-image-upload"
          type="file"
          accept="image/*"
          class="playlist-modal__file-input"
          @change="onFileChange" />
      </label>

      <div class="playlist-modal__fields">
        <div class="playlist-modal__field">
          <label class="playlist-modal__label" for="playlist-name">
            {{ $t('playlists.playlistName') }}
          </label>
          <input
            id="playlist-name"
            v-model="name"
            class="playlist-modal__input"
            type="text"
            :placeholder="$t('playlists.namePlaceholder')"
            maxlength="100" />
        </div>
        <div class="playlist-modal__field">
          <label class="playlist-modal__label" for="playlist-description">
            {{ $t('playlists.playlistDescription') }}
          </label>
          <textarea
            id="playlist-description"
            v-model="description"
            class="playlist-modal__textarea"
            :placeholder="$t('playlists.descriptionPlaceholder')"
            rows="3"
            maxlength="300" />
        </div>
      </div>
    </div>

    <template #footer>
      <button class="playlist-modal__btn playlist-modal__btn--ghost" @click="emit('close')">
        {{ $t('core.actions.cancel') }}
      </button>
      <button
        class="playlist-modal__btn playlist-modal__btn--primary"
        :disabled="!name.trim() || isSaving || isUploading"
        @click="submit">
        {{
          isSaving
            ? $t('playlists.saving')
            : editId
              ? $t('core.actions.save')
              : $t('playlists.createPlaylist')
        }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.playlist-modal {
  &__image-section {
    display: flex;
    align-items: stretch;
    gap: var(--space-6);

    @media (max-width: 576px) {
      flex-direction: column;
      align-items: center;

      .playlist-modal__image-label {
        width: 180px;
        height: 180px;
      }

      .playlist-modal__fields {
        width: 100%;
      }
    }
  }

  &__image-label {
    display: block;
    aspect-ratio: 1 / 1;
    flex-shrink: 0;
  }

  &__file-input {
    display: none;
  }

  &__image-preview {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-surface-hover);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

    @media (max-width: 480px) {
      /* Handled by label sizing above */
    }

    &:hover .playlist-modal__image-overlay {
      opacity: 1;
    }
  }

  &__image-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    color: var(--color-text-secondary);
  }

  &__image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    opacity: 0;
    transition: opacity var(--transition-fast);
    color: #fff;
    font-size: var(--text-2xl);

    span {
      font-size: var(--text-xs);
      font-weight: var(--font-weight-medium);
    }
  }

  &__fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__label {
    font-size: var(--text-xs);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__input,
  &__textarea {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    color: var(--color-text-primary);
    font-size: var(--text-sm);
    outline: none;
    resize: none;
    font-family: inherit;
    transition: border-color var(--transition-fast);

    &:focus {
      border-color: var(--color-primary);
    }
  }

  &__btn {
    padding: var(--space-2) var(--space-6);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    border: none;
    transition: all var(--transition-fast);

    &--ghost {
      background: transparent;
      color: var(--color-text-secondary);

      &:hover {
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
