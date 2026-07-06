<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  padding: 'md'
});
</script>

<template>
  <div class="card" :class="`card--padding-${props.padding}`">
    <div v-if="$slots.header" class="card__header">
      <slot name="header" />
    </div>
    <div class="card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  background-color: var(--card-bg, var(--color-surface));
  border: var(--card-border-width, 1px) solid var(--card-border-color, var(--color-border));
  border-radius: var(--card-radius, var(--radius-lg));
  box-shadow: var(--card-shadow, var(--shadow-sm));
  overflow: hidden;

  &--padding-none .card__body {
    padding: 0;
  }

  &--padding-sm .card__body {
    padding: var(--space-3);
  }

  &--padding-md .card__body {
    padding: var(--space-5);
  }

  &--padding-lg .card__body {
    padding: var(--space-8);
  }

  &__header {
    padding: var(--card-header-padding, var(--space-4) var(--space-5));
    border-bottom: 1px solid var(--color-border);
  }

  &__body {
    padding: var(--card-body-padding, var(--space-5));
  }

  &__footer {
    padding: var(--card-footer-padding, var(--space-4) var(--space-5));
    border-top: 1px solid var(--color-border);
  }
}
</style>
