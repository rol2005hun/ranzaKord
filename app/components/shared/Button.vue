<script setup lang="ts">
interface Props {
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  href: undefined,
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false
});
</script>

<template>
  <component
    :is="props.href ? 'a' : 'button'"
    :href="props.href"
    :type="props.href ? undefined : props.type"
    :disabled="props.href ? undefined : props.disabled || props.loading"
    :aria-disabled="props.disabled || props.loading"
    :aria-busy="props.loading"
    class="btn"
    :class="[`btn--${props.variant}`, `btn--${props.size}`, { 'btn--loading': props.loading }]">
    <span v-if="props.loading" class="btn__spinner" />
    <span class="btn__content" :class="{ 'btn__content--hidden': props.loading }">
      <slot />
    </span>
  </component>
</template>

<style scoped lang="scss">
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--btn-gap, var(--space-2));
  border-radius: var(--btn-radius, var(--radius-md));
  font-weight: var(--btn-font-weight, var(--font-weight-semibold));
  text-decoration: none;
  cursor: pointer;
  border: var(--btn-border-width, 2px) solid transparent;
  position: relative;
  white-space: nowrap;
  user-select: none;
  transition:
    background-color var(--transition-base),
    color var(--transition-base),
    border-color var(--transition-base),
    opacity var(--transition-base),
    box-shadow var(--transition-base);

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--color-ring);
  }

  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &--sm {
    padding: var(--btn-padding-y-sm, var(--space-1)) var(--btn-padding-x-sm, var(--space-3));
    font-size: var(--btn-font-size-sm, var(--text-xs));
  }

  &--md {
    padding: var(--btn-padding-y-md, var(--space-2)) var(--btn-padding-x-md, var(--space-5));
    font-size: var(--btn-font-size-md, var(--text-sm));
  }

  &--lg {
    padding: var(--btn-padding-y-lg, var(--space-3)) var(--btn-padding-x-lg, var(--space-8));
    font-size: var(--btn-font-size-lg, var(--text-base));
  }

  &--primary {
    background-color: var(--color-primary);
    color: var(--color-primary-foreground);

    &:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }
  }

  &--secondary {
    background-color: var(--color-surface);
    color: var(--color-text-primary);
    border-color: var(--color-border);

    &:hover:not(:disabled) {
      background-color: var(--color-surface-hover);
    }
  }

  &--ghost {
    background-color: transparent;
    color: var(--color-text-primary);

    &:hover:not(:disabled) {
      background-color: var(--color-surface-hover);
    }
  }

  &--danger {
    background-color: var(--color-danger);
    color: var(--color-danger-foreground);

    &:hover:not(:disabled) {
      background-color: var(--color-danger-hover);
    }
  }

  &--loading {
    cursor: wait;
  }

  &__spinner {
    position: absolute;
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: var(--radius-full);
    animation: btn-spin 0.6s linear infinite;
  }

  &__content {
    display: inline-flex;
    align-items: center;
    gap: inherit;

    &--hidden {
      visibility: hidden;
    }
  }
}

@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
