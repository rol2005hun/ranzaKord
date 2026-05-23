<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'md'
});
</script>

<template>
  <span class="badge" :class="[`badge--${props.variant}`, `badge--${props.size}`]">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.badge {
  display: inline-flex;
  align-items: center;
  font-weight: var(--badge-font-weight, var(--font-weight-medium));
  border-radius: var(--badge-radius, var(--radius-full));
  white-space: nowrap;
  line-height: 1;

  &--sm {
    padding: var(--badge-padding-y-sm, 0.125rem) var(--badge-padding-x-sm, var(--space-2));
    font-size: var(--badge-font-size-sm, var(--text-xs));
  }

  &--md {
    padding: var(--badge-padding-y-md, var(--space-1)) var(--badge-padding-x-md, var(--space-3));
    font-size: var(--badge-font-size-md, var(--text-xs));
  }

  &--primary {
    background-color: hsl(
      var(--color-primary-h) var(--color-primary-s) var(--color-primary-l) / 0.15
    );
    color: var(--color-primary);
  }

  &--success {
    background-color: var(--color-success-light);
    color: var(--color-success);
  }

  &--warning {
    background-color: var(--color-warning-light);
    color: var(--color-warning);
  }

  &--danger {
    background-color: var(--color-danger-light);
    color: var(--color-danger);
  }

  &--neutral {
    background-color: var(--color-surface-hover);
    color: var(--color-text-secondary);
  }
}
</style>
