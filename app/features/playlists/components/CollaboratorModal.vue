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
      <div class="collaborator-modal__add relative">
        <AppInput
          v-model="searchQuery"
          placeholder="Keresés név alapján..."
          :disabled="isSaving"
          class="w-full" />

        <div
          v-if="searchQuery.length >= 2"
          class="collaborator-modal__search-results absolute top-full left-0 w-full mt-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
          <div
            v-if="isSearching"
            class="p-4 text-center text-sm text-[var(--color-text-secondary)]">
            Keresés...
          </div>
          <div
            v-else-if="searchResults.length === 0"
            class="p-4 text-center text-sm text-[var(--color-text-secondary)]">
            Nem található felhasználó. (Csak publikus profilok!)
          </div>
          <div
            v-for="user in searchResults"
            v-else
            :key="user.sub"
            class="flex items-center justify-between p-3 hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer border-b border-[var(--color-border)] last:border-b-0"
            @click="addCollaborator(user.sub)">
            <div class="flex items-center gap-3">
              <img
                v-if="user.picture"
                :src="user.picture"
                class="w-8 h-8 rounded-full object-cover" />
              <div
                v-else
                class="w-8 h-8 rounded-full bg-[var(--color-bg-soft)] flex items-center justify-center">
                <AppIcon name="ph:user-fill" class="text-xs" />
              </div>
              <span class="font-medium text-[var(--color-text-primary)]">{{ user.name }}</span>
            </div>
            <AppButton
              variant="ghost"
              size="sm"
              class="text-[var(--color-primary)] font-bold shrink-0">
              Hozzáadás
            </AppButton>
          </div>
        </div>
      </div>

      <div class="collaborator-modal__list mt-6">
        <h4
          class="text-sm uppercase font-bold text-[var(--color-text-secondary)] tracking-wider mb-4">
          Jelenlegi kollaborátorok
        </h4>
        <div
          v-if="collaborators.length === 0"
          class="text-sm text-[var(--color-text-secondary)] p-4 text-center bg-[var(--color-bg-soft)] rounded-lg">
          Nincsenek kollaborátorok. Keresd meg a barátaidat fentebb!
        </div>
        <div
          v-for="user in collaborators"
          :key="user.sub"
          class="flex items-center justify-between p-3 bg-[var(--color-bg-soft)] rounded-lg mb-2">
          <NuxtLink
            :to="`/user/${user.sub}`"
            class="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              v-if="user.picture"
              :src="user.picture"
              class="w-10 h-10 rounded-full object-cover" />
            <div
              v-else
              class="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center">
              <AppIcon name="ph:user-fill" />
            </div>
            <span class="font-medium text-[var(--color-text-primary)]">{{ user.name }}</span>
          </NuxtLink>
          <AppButton
            variant="ghost"
            size="sm"
            class="text-danger hover:bg-danger/10"
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
}
</style>
