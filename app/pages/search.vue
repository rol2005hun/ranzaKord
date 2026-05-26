<script setup lang="ts">
definePageMeta({
  layout: 'music',
  middleware: ['auth']
});

useHead({ title: 'Search' });
</script>

<template>
  <div class="search-page">
    <div class="search-page__header">
      <h1 class="search-page__title">{{ $t('search.title') }}</h1>
      <SearchBar class="search-page__bar" />
    </div>
    <SearchResults />
  </div>
</template>

<style lang="scss" scoped>
.search-page {
  padding: var(--space-8);

  &__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    margin-bottom: var(--space-6);
  }

  &__title {
    font-size: var(--text-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  &__bar {
    max-width: 560px;
  }
}
</style>
