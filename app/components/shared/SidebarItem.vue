<script setup lang="ts">
import { NuxtLink } from '#components';

interface Props {
  to?: string;
  icon?: string;
  label: string;
  active?: boolean;
}

defineProps<Props>();
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    class="app-sidebar-item"
    :class="{ 'app-sidebar-item--active': active }"
    exact-active-class="app-sidebar-item--active">
    <AppIcon v-if="icon" :name="icon" class="app-sidebar-item__icon" />
    <span class="app-sidebar__text">{{ label }}</span>
  </component>
</template>

<style lang="scss">
.app-sidebar-item {
  display: flex;
  align-items: center;
  width: 3rem;
  height: 3rem;
  margin: 0 0.75rem 4px 0.75rem;
  padding: 0;
  padding-left: 0.85rem;
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  transition:
    width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color var(--transition-fast),
    color var(--transition-fast);

  &:hover {
    background-color: var(--color-surface-hover);
    color: var(--color-text-primary);
  }

  &--active {
    background-color: var(--color-primary-subtle);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
  }

  &__icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    margin-right: var(--space-2);
  }

  @media (max-width: 768px) {
    width: auto;
    height: auto;
    margin: 0;
    padding: var(--space-2);
    flex-direction: column;
    justify-content: center;

    .app-sidebar__text {
      display: none;
    }

    .app-sidebar-item__icon {
      font-size: 1.5rem;
    }
  }
}
</style>
