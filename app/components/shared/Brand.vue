<script setup lang="ts"></script>

<template>
  <div class="app-brand">
    <NuxtImg src="/logo.webp" alt="ranzaKonnect" height="34" class="app-brand__logo" />
  </div>
</template>

<style lang="scss" scoped>
.app-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  filter: drop-shadow(0 0 6px var(--color-primary-glow));

  &__logo {
    flex-shrink: 0;
    height: 34px;
    width: auto;
    object-fit: contain;

    :global([data-theme='light']) &,
    :global([data-theme='rose']) & {
      filter: invert(1) hue-rotate(180deg);
    }
  }
}
</style>
