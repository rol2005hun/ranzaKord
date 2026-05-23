<script setup lang="ts">
interface Props {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
}

const props = withDefaults(defineProps<Props>(), {
  src: undefined,
  alt: '',
  size: 'md',
  fallback: ''
});

const imageError = ref<boolean>(false);

const initials = computed<string>(() => {
  return props.fallback
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

function handleImageError(): void {
  imageError.value = true;
}
</script>

<template>
  <span class="avatar" :class="`avatar--${props.size}`">
    <img
      v-if="props.src && !imageError"
      :src="props.src"
      :alt="props.alt"
      class="avatar__image"
      @error="handleImageError" />
    <span v-else class="avatar__fallback">
      {{ initials }}
    </span>
  </span>
</template>

<style scoped lang="scss">
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--avatar-radius, var(--radius-full));
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--avatar-fallback-bg, var(--color-primary));
  color: var(--avatar-fallback-color, var(--color-primary-foreground));

  &--sm {
    width: var(--avatar-size-sm, 2rem);
    height: var(--avatar-size-sm, 2rem);
    font-size: var(--text-xs);
  }

  &--md {
    width: var(--avatar-size-md, 2.5rem);
    height: var(--avatar-size-md, 2.5rem);
    font-size: var(--text-sm);
  }

  &--lg {
    width: var(--avatar-size-lg, 3rem);
    height: var(--avatar-size-lg, 3rem);
    font-size: var(--text-base);
  }

  &--xl {
    width: var(--avatar-size-xl, 4rem);
    height: var(--avatar-size-xl, 4rem);
    font-size: var(--text-xl);
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__fallback {
    font-weight: var(--font-weight-semibold);
    line-height: 1;
    user-select: none;
  }
}
</style>
