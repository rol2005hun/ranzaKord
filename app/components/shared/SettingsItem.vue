<script setup lang="ts">
interface Props {
  title?: string;
  description?: string;
  border?: boolean;
  sub?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
  border: false,
  sub: false
});
</script>

<template>
  <div
    class="settings-item"
    :class="{
      'settings-item--border': props.border,
      'settings-item--sub': props.sub
    }">
    <div class="settings-item__info">
      <span v-if="props.title" class="settings-item__title">{{ props.title }}</span>
      <span v-if="props.description" class="settings-item__desc">{{ props.description }}</span>
      <slot name="info" />
    </div>
    <div class="settings-item__action">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6);

  &--border {
    border-top: 1px solid var(--color-border);
  }

  &--sub {
    padding-left: var(--space-10);
    border-top: none;
    padding-top: var(--space-2);
    padding-bottom: var(--space-4);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__title {
    font-size: var(--text-base);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  &__desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }
}
</style>
