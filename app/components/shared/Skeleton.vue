<script setup lang="ts">
interface Props {
  width?: string;
  height?: string;
  borderRadius?: string;
  circle?: boolean;
}

withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '100%',
  borderRadius: 'var(--radius-md)',
  circle: false
});
</script>

<template>
  <div
    class="app-skeleton"
    :class="{ 'app-skeleton--circle': circle }"
    :style="{ width, height, borderRadius: circle ? '50%' : borderRadius }"></div>
</template>

<style scoped lang="scss">
.app-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-hover) 25%,
    var(--color-surface-raised) 50%,
    var(--color-surface-hover) 75%
  );
  background-size: 200% 100%;
  animation: app-skeleton-loading 1.5s infinite linear;
}

@keyframes app-skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
