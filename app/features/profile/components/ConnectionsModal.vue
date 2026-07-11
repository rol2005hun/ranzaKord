<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { UserConnectionsResponse } from '../types/profile.types';

interface Props {
  modelValue: boolean;
  userId: string;
  type: 'followers' | 'following';
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { t } = useI18n({ useScope: 'global' });

const data = ref<UserConnectionsResponse | null>(null);
const pending = ref(false);
const error = ref<Error | null>(null);

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      data.value = null;
      error.value = null;
      pending.value = true;

      try {
        const response = await $fetch<UserConnectionsResponse>(
          `/api/user/connections?id=${props.userId}&type=${props.type}`
        );
        data.value = response;
      } catch (err) {
        console.error('Failed to fetch connections:', err);
        error.value = err as Error;
      } finally {
        pending.value = false;
      }
    }
  }
);

const modalTitle = computed(() => {
  return props.type === 'followers'
    ? t('profile.connectionsModalTitle.followers')
    : t('profile.connectionsModalTitle.following');
});

const close = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <AppModal :model-value="modelValue" :title="modalTitle" @update:model-value="close">
    <div class="connections-modal">
      <div v-if="pending && !data" class="connections-modal__loading">
        <AppSpinner size="md" />
      </div>

      <div v-else-if="error" class="connections-modal__error">
        {{ t('core.errors.unknown') }}
      </div>

      <div v-else-if="data" class="connections-modal__content">
        <div v-if="data.users.length === 0" class="connections-modal__empty">
          <template v-if="data.anonymousCount === 0">
            {{ t('profile.noConnections') }}
          </template>
          <template v-else>
            {{ t('profile.anonymousCountOnly', { count: data.anonymousCount }) }}
          </template>
        </div>

        <div v-else class="connections-modal__list">
          <NuxtLink
            v-for="user in data.users"
            :key="user.sub"
            :to="`/user/${user.sub}`"
            class="connections-modal__user"
            @click="close">
            <div class="connections-modal__avatar">
              <img v-if="user.picture" :src="user.picture" :alt="user.name" />
              <AppIcon v-else name="ph:user-fill" class="connections-modal__avatar-icon" />
            </div>
            <span class="connections-modal__name">{{ user.name }}</span>
          </NuxtLink>

          <div v-if="data.anonymousCount > 0" class="connections-modal__anonymous">
            {{ t('profile.anonymousCount', { count: data.anonymousCount }) }}
          </div>
        </div>
      </div>
    </div>
  </AppModal>
</template>

<style scoped lang="scss">
.connections-modal {
  display: flex;
  flex-direction: column;
  min-height: 200px;
  max-height: 50vh;

  &__loading,
  &__error,
  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--color-text-secondary);
    padding: var(--space-6);
    text-align: center;
  }

  &__content {
    display: flex;
    flex-direction: column;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--color-surface-raised);
      border-radius: var(--radius-full);
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    text-decoration: none;
    color: var(--color-text-primary);
    transition: background-color var(--transition-fast);
    border-radius: var(--radius-md);

    &:hover {
      background-color: var(--color-surface-hover);
    }
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: var(--color-surface-raised);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__avatar-icon {
    font-size: 1.5rem;
    color: var(--color-text-secondary);
  }

  &__name {
    font-size: var(--text-base);
    font-weight: var(--font-weight-medium);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__anonymous {
    padding: var(--space-3) var(--space-4);
    text-align: center;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    font-style: italic;
    border-top: 1px solid var(--color-surface-raised);
    margin-top: var(--space-2);
  }
}
</style>
