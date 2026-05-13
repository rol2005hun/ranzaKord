<script setup lang="ts">
interface Props {
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  href: undefined,
  variant: 'primary',
  type: 'button',
  disabled: false
});
</script>

<template>
  <component
    :is="props.href ? 'a' : 'button'"
    :href="props.href"
    :type="props.href ? undefined : props.type"
    :disabled="props.href ? undefined : props.disabled"
    :aria-disabled="props.disabled"
    class="btn"
    :class="`btn--${props.variant}`">
    <slot />
  </component>
</template>

<style lang="scss" scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  border: 2px solid transparent;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    opacity 0.2s ease;

  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &--primary {
    background-color: var(--color-primary);
    color: var(--color-primary-foreground);

    &:hover {
      background-color: var(--color-primary-hover);
    }
  }

  &--secondary {
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    border-color: var(--color-border);

    &:hover {
      background-color: var(--color-surface-hover);
    }
  }

  &--ghost {
    background-color: transparent;
    color: var(--color-text-primary);

    &:hover {
      background-color: var(--color-surface-hover);
    }
  }
}
</style>
