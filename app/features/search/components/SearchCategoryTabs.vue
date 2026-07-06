<script setup lang="ts">
import type { SearchResultType } from '../types/search.types';

interface Props {
  modelValue: 'all' | SearchResultType;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: 'all' | SearchResultType): void;
}>();

const tabs = [
  { value: 'all', label: 'All' },
  { value: 'song', label: 'Songs' },
  { value: 'artist', label: 'Artists' },
  { value: 'album', label: 'Albums' }
];
</script>

<template>
  <div class="search-category-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="search-category-tabs__tab"
      :class="{ 'search-category-tabs__tab--active': props.modelValue === tab.value }"
      @click="emit('update:modelValue', tab.value as 'all' | SearchResultType)">
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.search-category-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  overflow-x: auto;
  padding-bottom: var(--space-2);

  &::-webkit-scrollbar {
    display: none;
  }

  &__tab {
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    border: none;
    border-radius: 20px;
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    white-space: nowrap;
    transition:
      background-color var(--transition-fast),
      color var(--transition-fast);

    &:hover {
      background-color: var(--color-surface-hover);
    }

    &--active {
      background-color: var(--color-text-primary);
      color: var(--color-surface);

      &:hover {
        background-color: var(--color-text-primary);
      }
    }
  }
}
</style>
