<script setup lang="ts">
interface Props {
  name: string;
  size?: string | number;
}

const props = withDefaults(defineProps<Props>(), {
  size: '1.25rem'
});
</script>

<template>
  <span class="app-icon-wrapper">
    <Icon :name="props.name" :size="String(props.size)" class="app-icon" />
  </span>
</template>

<style scoped lang="scss">
.app-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--app-icon-size);
  height: var(--app-icon-size);
  line-height: 0;
  color: inherit;
}

.app-icon {
  color: inherit;
}
</style>
