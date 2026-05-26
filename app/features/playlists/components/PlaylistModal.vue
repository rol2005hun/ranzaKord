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

const { t } = useI18n();
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
  <ClientOnly>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="open" class="playlist-modal" @click.self="emit('close')">
          <div class="playlist-modal__dialog">
            <button
              class="playlist-modal__close"
              :aria-label="t('core.nav.settings')"
              @click="emit('close')">
              <AppIcon name="ph:x-bold" />
            </button>

            <h2 class="playlist-modal__title">
              {{ editId ? $t('playlists.editPlaylist') : $t('playlists.createPlaylist') }}
            </h2>

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
                  <div class="playlist-modal__image-overlay">
                    <AppIcon
                      v-if="isUploading"
                      name="ph:circle-notch"
                      class="playlist-modal__spinner" />
                    <AppIcon v-else name="ph:pencil-simple-fill" />
                    <span>
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

            <div class="playlist-modal__actions">
              <button class="playlist-modal__btn playlist-modal__btn--ghost" @click="emit('close')">
                Cancel
              </button>
              <button
                class="playlist-modal__btn playlist-modal__btn--primary"
                :disabled="!name.trim() || isSaving || isUploading"
                @click="submit">
                {{
                  isSaving
                    ? $t('playlists.saving')
                    : editId
                      ? 'Save'
                      : $t('playlists.createPlaylist')
                }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<style scoped lang="scss">
.playlist-modal {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 1000);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);

  &__dialog {
    position: relative;
    background: var(--color-surface);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    width: 100%;
    max-width: 540px;
    margin: var(--space-4);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  }

  &__close {
    position: absolute;
    top: var(--space-4);
    right: var(--space-4);
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    padding: var(--space-1);
    border-radius: var(--radius-full);
    display: flex;
    font-size: var(--text-xl);
    transition: color var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
    }
  }

  &__title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-6);
  }

  &__image-section {
    display: flex;
    gap: var(--space-6);
    margin-bottom: var(--space-6);

    @media (max-width: 480px) {
      flex-direction: column;
      align-items: center;
    }
  }

  &__image-label {
    cursor: pointer;
    flex-shrink: 0;
  }

  &__file-input {
    display: none;
  }

  &__image-preview {
    position: relative;
    width: 140px;
    height: 140px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--color-surface-hover);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

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
    font-size: var(--text-xs);
    color: #fff;
    font-size: var(--text-2xl);

    span {
      font-size: var(--text-xs);
    }
  }

  &__spinner {
    animation: spin 1s linear infinite;
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

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-2);
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

.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;

  .playlist-modal__dialog {
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .playlist-modal__dialog {
    transform: scale(0.9) translateY(20px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
