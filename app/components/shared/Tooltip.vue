<script setup lang="ts">
interface Props {
  text: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top'
});

const isVisible = ref<boolean>(false);

function show(): void {
  isVisible.value = true;
}

function hide(): void {
  isVisible.value = false;
}
</script>

<template>
  <span class="tooltip-wrapper" @mouseenter="show" @mouseleave="hide" @focus="show" @blur="hide">
    <slot />
    <Transition name="tooltip">
      <span v-if="isVisible" class="tooltip" :class="`tooltip--${props.position}`" role="tooltip">
        {{ props.text }}
      </span>
    </Transition>
  </span>
</template>

<style scoped lang="scss">
.tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.tooltip {
  position: absolute;
  padding: var(--tooltip-padding-y, var(--space-1)) var(--tooltip-padding-x, var(--space-2));
  font-size: var(--tooltip-font-size, var(--text-xs));
  font-weight: var(--font-weight-medium);
  color: var(--tooltip-color, #ffffff);
  background-color: var(--tooltip-bg, var(--color-text-primary));
  border-radius: var(--tooltip-radius, var(--radius-md));
  white-space: nowrap;
  pointer-events: none;
  z-index: var(--z-tooltip);
  line-height: var(--leading-normal);

  &--top {
    bottom: calc(100% + var(--tooltip-offset, var(--space-2)));
    left: 50%;
    transform: translateX(-50%);
  }

  &--bottom {
    top: calc(100% + var(--tooltip-offset, var(--space-2)));
    left: 50%;
    transform: translateX(-50%);
  }

  &--left {
    right: calc(100% + var(--tooltip-offset, var(--space-2)));
    top: 50%;
    transform: translateY(-50%);
  }

  &--right {
    left: calc(100% + var(--tooltip-offset, var(--space-2)));
    top: 50%;
    transform: translateY(-50%);
  }
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
