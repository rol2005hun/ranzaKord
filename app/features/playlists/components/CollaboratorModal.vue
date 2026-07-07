<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  playlistId: string;
  collaborators: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const newCollaboratorSub = ref('');
const isSaving = ref(false);
const toast = useToast();

const addCollaborator = async () => {
  if (!newCollaboratorSub.value.trim()) return;

  isSaving.value = true;
  try {
    await $fetch(`/api/playlists/${props.playlistId}/collaborators`, {
      method: 'POST',
      body: {
        action: 'add',
        collaboratorSub: newCollaboratorSub.value.trim()
      }
    });
    toast.success('Kollaborátor hozzáadva');
    newCollaboratorSub.value = '';
    emit('saved');
  } catch (err) {
    const error = err as { data?: { statusMessage?: string } };
    toast.danger(error.data?.statusMessage || 'Hiba történt');
  } finally {
    isSaving.value = false;
  }
};

const removeCollaborator = async (sub: string) => {
  if (!confirm('Biztosan eltávolítod?')) return;

  try {
    await $fetch(`/api/playlists/${props.playlistId}/collaborators`, {
      method: 'POST',
      body: {
        action: 'remove',
        collaboratorSub: sub
      }
    });
    toast.success('Kollaborátor eltávolítva');
    emit('saved');
  } catch (err) {
    const error = err as { data?: { statusMessage?: string } };
    toast.danger(error.data?.statusMessage || 'Hiba történt');
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
          v-model="newCollaboratorSub"
          placeholder="Felhasználó azonosító (sub)"
          :disabled="isSaving"
          @keyup.enter="addCollaborator" />
        <AppButton
          variant="primary"
          :disabled="isSaving || !newCollaboratorSub"
          @click="addCollaborator">
          Hozzáadás
        </AppButton>
      </div>

      <div class="collaborator-modal__list">
        <h4>Jelenlegi kollaborátorok (sub)</h4>
        <div v-if="collaborators.length === 0" class="collaborator-modal__empty">
          Nincsenek kollaborátorok.
        </div>
        <div v-for="sub in collaborators" :key="sub" class="collaborator-modal__item">
          <span>{{ sub }}</span>
          <AppButton variant="ghost" size="sm" class="text-danger" @click="removeCollaborator(sub)">
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
  gap: var(--space-6);

  &__add {
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;

    .app-input {
      flex: 1;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    h4 {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
    }
  }

  &__empty {
    color: var(--color-text-tertiary);
    font-size: var(--text-sm);
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3);
    background: var(--color-surface);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
  }
}
.text-danger {
  color: var(--color-danger);
}
</style>
