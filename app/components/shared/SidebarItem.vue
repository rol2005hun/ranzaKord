<script setup lang="ts">
import { NuxtLink } from '#components';

interface Props {
  to?: string;
  icon?: string;
  label: string;
  active?: boolean;
  isNew?: boolean;
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
    <div class="app-sidebar-item__icon-wrapper">
      <AppIcon v-if="icon" :name="icon" class="app-sidebar-item__icon" />
      <span v-if="isNew" class="app-sidebar-item__new-badge">Új</span>
    </div>
    <span class="app-sidebar__text">{{ label }}</span>
  </component>
</template>

<style lang="scss">
.app-sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 3rem;
  height: 3rem;
  margin: 0 0.75rem 4px 0.75rem;
  padding: 0;
  padding-left: 0.75rem;
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: visible;
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

  &__icon-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  &__icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  &__new-badge {
    position: absolute;
    top: -4px;
    right: -12px;
    background-color: var(--color-brand, #7c3aed);
    color: #ffffff;
    font-size: 0.5rem;
    font-weight: 800;
    padding: 1px 5px;
    border-radius: var(--radius-full);
    text-transform: uppercase;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
    z-index: 10;
    pointer-events: none;
    letter-spacing: 0.5px;
    border: 1px solid color-mix(in srgb, var(--color-surface) 50%, transparent);
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
