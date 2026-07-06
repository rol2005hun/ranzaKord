<script setup lang="ts">
interface Props {
  title: string;
  layout?: 'list' | 'grid';
  isLoading?: boolean;
  skeletonCount?: number;
}

withDefaults(defineProps<Props>(), {
  layout: 'list',
  isLoading: false,
  skeletonCount: 5
});
</script>

<template>
  <div class="music-section">
    <div v-if="isLoading && layout === 'list'">
      <div v-if="title" class="skeleton-line skeleton-line--section-title"></div>
      <div class="music-section__list">
        <div
          v-for="i in skeletonCount"
          :key="`list-skel-${i}`"
          class="music-section__list-skeleton">
          <div class="music-section__list-thumb skeleton-box"></div>
          <div class="music-section__list-text">
            <div class="skeleton-line skeleton-line--title"></div>
            <div class="skeleton-line skeleton-line--subtitle"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isLoading && layout === 'grid'">
      <div v-if="title" class="skeleton-line skeleton-line--section-title"></div>
      <div class="music-section__grid">
        <div
          v-for="i in skeletonCount"
          :key="`grid-skel-${i}`"
          class="music-section__grid-skeleton">
          <div class="music-section__grid-thumb skeleton-box"></div>
          <div class="music-section__grid-text">
            <div class="skeleton-line skeleton-line--title-lg"></div>
            <div class="skeleton-line skeleton-line--subtitle"></div>
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <h2 v-if="title" class="music-section__title">{{ title }}</h2>
      <div :class="layout === 'grid' ? 'music-section__grid' : 'music-section__list'">
        <slot></slot>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.music-section {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-8);

  &__title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--space-6);
    color: var(--color-text-primary);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--space-4);

    @media (min-width: 1024px) {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }

  &__list-skeleton {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
  }

  &__list-thumb {
    width: 48px;
    height: 48px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
  }

  &__list-text {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    flex: 1;
  }

  &__grid-skeleton {
    background-color: var(--color-surface);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__grid-thumb {
    width: 92px;
    height: 92px;
    border-radius: var(--radius-sm);
  }

  &__grid-text {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .skeleton-box {
    background: var(--color-surface-raised);
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-line {
    background: var(--color-surface-raised);
    height: 12px;
    border-radius: var(--radius-sm);
    animation: pulse 1.5s infinite ease-in-out;

    &--section-title {
      width: 180px;
      height: 28px;
      margin-bottom: var(--space-6);
    }
    &--title {
      width: 140px;
    }
    &--title-lg {
      width: 80%;
      height: 16px;
    }
    &--subtitle {
      width: 90px;
      height: 10px;
    }
  }

  @keyframes pulse {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 0.5;
    }
  }
}
</style>
