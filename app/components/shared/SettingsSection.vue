<script setup lang="ts">
// Shared container for settings items
</script>

<template>
  <div class="settings-section">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.settings-section {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}
</style>
