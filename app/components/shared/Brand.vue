<script setup lang="ts"></script>

<template>
  <div class="app-brand">
    <img src="/logo.webp" alt="ranzaKonnect" height="34" class="app-brand__logo" />
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
  }
}
</style>

<style lang="scss">
[data-theme='light'] .app-brand__logo,
[data-theme='rose'] .app-brand__logo {
  filter: invert(1) hue-rotate(180deg);
}
[data-theme='walker'] .app-brand img {
  filter: grayscale(1) sepia(1) saturate(1200%) hue-rotate(0deg) brightness(1.8) contrast(0.7);
}
</style>
