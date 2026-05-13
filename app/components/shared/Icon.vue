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
  <Icon :name="props.name" :size="String(props.size)" class="app-icon" />
</template>

<style lang="scss" scoped>
.app-icon {
  display: inline-flex;
  flex-shrink: 0;
  color: inherit;
}
</style>
