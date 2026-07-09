<script setup lang="ts">
import { ref, watch } from 'vue';
import type { UserProfileMin } from '../types/playlists.types';

const props = defineProps<{
  modelValue: boolean;
  playlistId: string;
  collaborators: UserProfileMin[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const searchQuery = ref('');
const searchResults = ref<UserProfileMin[]>([]);
const isSearching = ref(false);
const isSaving = ref(false);
const toast = useToast();
const { t } = useI18n();

const searchUsers = async () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = [];
    return;
  }
  isSearching.value = true;
  try {
    const res = await $fetch<{ users: UserProfileMin[] }>(
      `/api/user/search?q=${encodeURIComponent(searchQuery.value)}`
    );
    // Filter out users who are already collaborators
    searchResults.value = res.users.filter(
      (u) => !props.collaborators.some((c) => c.sub === u.sub)
    );
  } catch {
    toast.danger('Hiba a keresés során');
  } finally {
    isSearching.value = false;
  }
};

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchUsers();
  }, 300);
});

const addCollaborator = async (sub: string) => {
  isSaving.value = true;
  try {
    await $fetch(`/api/playlists/${props.playlistId}/collaborators`, {
      method: 'POST',
      body: {
        action: 'add',
        collaboratorSub: sub
      }
    });
    toast.success(t('playlists.collaboratorAdded'));
    searchQuery.value = '';
    searchResults.value = [];
    emit('saved');
  } catch (err) {
    const error = err as { data?: { statusMessage?: string } };
    toast.danger(error.data?.statusMessage || t('core.error'));
  } finally {
    isSaving.value = false;
  }
};

const removeCollaborator = async (sub: string) => {
  if (!confirm(t('playlists.confirmRemove'))) return;

  try {
    await $fetch(`/api/playlists/${props.playlistId}/collaborators`, {
      method: 'POST',
      body: {
        action: 'remove',
        collaboratorSub: sub
      }
    });
    toast.success(t('playlists.collaboratorRemoved'));
    emit('saved');
  } catch (err) {
    const error = err as { data?: { statusMessage?: string } };
    toast.danger(error.data?.statusMessage || t('core.error'));
  }
};
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="Kollaborátorok kezelése"
    @update:model-value="(val) => emit('update:modelValue', val)">
    <div class="collaborator-modal">
      <div class="collaborator-modal__add">
        <AppInput
          v-model="searchQuery"
          placeholder="Keresés név alapján..."
          :disabled="isSaving"
          class="collaborator-modal__input" />

        <div
          v-if="searchQuery.length >= 2"
          class="collaborator-modal__search-results">
          <div
            v-if="isSearching"
            class="collaborator-modal__search-status">
            Keresés...
          </div>
          <div
            v-else-if="searchResults.length === 0"
            class="collaborator-modal__search-status">
            Nem található felhasználó. (Csak publikus profilok!)
          </div>
          <div
            v-for="user in searchResults"
            v-else
            :key="user.sub"
            class="collaborator-modal__search-item"
            @click="addCollaborator(user.sub)">
            <div class="collaborator-modal__user-info">
              <img
                v-if="user.picture"
                :src="user.picture"
                class="collaborator-modal__avatar" />
              <div
                v-else
                class="collaborator-modal__avatar">
                <AppIcon name="ph:user-fill" class="collaborator-modal__avatar-icon" />
              </div>
              <span class="collaborator-modal__name">{{ user.name }}</span>
            </div>
            <AppButton
              variant="ghost"
              size="sm"
              class="collaborator-modal__add-btn">
              Hozzáadás
            </AppButton>
          </div>
        </div>
      </div>

      <div class="collaborator-modal__list">
        <h4 class="collaborator-modal__title">
          Jelenlegi kollaborátorok
        </h4>
        <div
          v-if="collaborators.length === 0"
          class="collaborator-modal__empty">
          Nincsenek kollaborátorok. Keresd meg a barátaidat fentebb!
        </div>
        <div
          v-for="user in collaborators"
          :key="user.sub"
          class="collaborator-modal__collaborator">
          <NuxtLink
            :to="`/user/${user.sub}`"
            class="collaborator-modal__link">
            <img
              v-if="user.picture"
              :src="user.picture"
              class="collaborator-modal__collab-avatar" />
            <div
              v-else
              class="collaborator-modal__collab-avatar">
              <AppIcon name="ph:user-fill" />
            </div>
            <span class="collaborator-modal__name">{{ user.name }}</span>
          </NuxtLink>
          <AppButton
            variant="ghost"
            size="sm"
            class="collaborator-modal__remove-btn"
            @click="removeCollaborator(user.sub)">
            <AppIcon name="ph:trash" />
          </AppButton>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.collaborator-modal {
  display: flex;
  flex-direction: column;
  min-height: 350px;

  &__add {
    position: relative;
    margin-bottom: 2rem;
  }

  &__input {
    width: 100%;
  }

  &__search-results {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    margin-top: 0.5rem;
    background-color: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 0.5rem);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    z-index: 10;
    max-height: 240px;
    overflow-y: auto;
  }

  &__search-status {
    padding: 1rem;
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-text-secondary);
  }

  &__search-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    transition: background-color 0.2s;
    cursor: pointer;
    border-bottom: 1px solid var(--color-border);

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: var(--color-bg-hover);
    }
  }

  &__user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    object-fit: cover;
    background-color: var(--color-bg-soft);
    display: flex;
    align-items: center;
    justify-content: center;

    &-icon {
      font-size: 0.75rem;
    }
  }

  &__name {
    font-weight: 500;
    color: var(--color-text-primary);
  }

  &__add-btn {
    color: var(--color-primary) !important;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__list {
    margin-top: auto;
  }

  &__title {
    font-size: 0.875rem;
    text-transform: uppercase;
    font-weight: 700;
    color: var(--color-text-secondary);
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
  }

  &__empty {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    padding: 1rem;
    text-align: center;
    background-color: var(--color-bg-soft);
    border-radius: var(--radius-md, 0.5rem);
  }

  &__collaborator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background-color: var(--color-bg-soft);
    border-radius: var(--radius-md, 0.5rem);
    margin-bottom: 0.5rem;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }

  &__collab-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    object-fit: cover;
    background-color: var(--color-bg-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__remove-btn {
    color: #ef4444 !important;
    
    &:hover {
      background-color: rgba(239, 68, 68, 0.1) !important;
    }
  }
}
</style>
