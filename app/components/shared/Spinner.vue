<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
});
</script>

<template>
  <svg
    class="spinner"
    :class="`spinner--${props.size}`"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Loading">
    <circle class="spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
    <path
      class="spinner__arc"
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round" />
  </svg>
</template>

<style scoped lang="scss">
.spinner {
  animation: spinner-rotate 0.75s linear infinite;
  color: var(--spinner-color, var(--color-primary));

  &--sm {
    width: var(--spinner-size-sm, 1rem);
    height: var(--spinner-size-sm, 1rem);
  }

  &--md {
    width: var(--spinner-size-md, 1.5rem);
    height: var(--spinner-size-md, 1.5rem);
  }

  &--lg {
    width: var(--spinner-size-lg, 2.5rem);
    height: var(--spinner-size-lg, 2.5rem);
  }

  &__track {
    opacity: 0.15;
  }

  &__arc {
    opacity: 1;
  }
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
