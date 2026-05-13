<script setup lang="ts">
const { hero, setup } = useHome()

setup()
</script>

<template>
  <section class="hero">
    <h1 class="hero__title">{{ hero.title }}</h1>
    <p class="hero__subtitle">{{ hero.subtitle }}</p>
    <AppButton :href="hero.ctaHref" variant="primary">
      {{ hero.ctaLabel }}
    </AppButton>
  </section>
</template>

<style lang="scss" scoped>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-16) var(--space-6);
  text-align: center;

  &__title {
    font-size: var(--text-4xl);
    font-weight: 700;
    color: var(--color-text-primary);
  }

  &__subtitle {
    font-size: var(--text-lg);
    color: var(--color-text-secondary);
    max-width: 48ch;
  }
}
</style>
