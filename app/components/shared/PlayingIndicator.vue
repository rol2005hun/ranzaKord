<script setup lang="ts">
const playerStore = usePlayerStore();
</script>

<template>
  <div class="playing-indicator" :class="{ 'playing-indicator--paused': !playerStore.isPlaying }">
    <span class="playing-indicator__bar" />
    <span class="playing-indicator__bar" />
    <span class="playing-indicator__bar" />
  </div>
</template>

<style scoped lang="scss">
.playing-indicator {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
  transition: opacity 0.2s ease;

  &__bar {
    width: 4px;
    background-color: var(--color-primary);
    border-radius: 1px;
    animation: playing-bar 1s ease-in-out infinite;

    &:nth-child(1) {
      animation-delay: 0s;
      height: 8px;
    }
    &:nth-child(2) {
      animation-delay: 0.15s;
      height: 16px;
    }
    &:nth-child(3) {
      animation-delay: 0.3s;
      height: 12px;
    }
  }

  &--paused &__bar {
    animation-play-state: paused;
  }
}

@keyframes playing-bar {
  0%,
  100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1);
  }
}
</style>
