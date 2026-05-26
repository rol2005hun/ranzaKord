<script setup lang="ts">
definePageMeta({
  layout: 'music',
  middleware: ['auth']
});

useHead({ title: 'Settings' });
</script>

<template>
  <div class="settings-page">
    <h1 class="settings-page__title">Settings</h1>
    <p class="settings-page__desc">Settings will be available here.</p>
  </div>
</template>

<style lang="scss" scoped>
.settings-page {
  padding: var(--space-8);

  &__title {
    font-size: var(--text-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--space-4);
  }

  &__desc {
    color: var(--color-text-secondary);
  }
}
</style>
