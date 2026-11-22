<script setup lang="ts">
interface Props {
  text?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  position: 'top'
});

const isVisible = ref<boolean>(false);

function show(): void {
  if (props.text) {
    isVisible.value = true;
  }
}

function hide(): void {
  isVisible.value = false;
}
</script>

<template>
  <span class="tooltip-wrapper" @mouseenter="show" @mouseleave="hide" @focus="show" @blur="hide">
    <slot />
    <Transition name="tooltip">
      <span
        v-if="isVisible && props.text"
        class="tooltip"
        :class="`tooltip--${props.position}`"
        role="tooltip">
        {{ props.text }}
      </span>
    </Transition>
  </span>
</template>

<style scoped lang="scss">
.tooltip-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tooltip {
  position: absolute;
  padding: 4px 8px;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  background-color: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  border-radius: var(--radius-md);
  white-space: nowrap;
  pointer-events: none;
  z-index: var(--z-modal);
  line-height: var(--leading-normal);

  &--top {
    bottom: calc(100% + var(--space-2));
    left: 50%;
    transform: translateX(-50%);
  }

  &--bottom {
    top: calc(100% + var(--space-2));
    left: 50%;
    transform: translateX(-50%);
  }

  &--left {
    right: calc(100% + var(--space-2));
    top: 50%;
    transform: translateY(-50%);
  }

  &--right {
    left: calc(100% + var(--space-2));
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

  &.tooltip--top {
    transform: translateX(-50%) translateY(4px);
  }

  &.tooltip--bottom {
    transform: translateX(-50%) translateY(-4px);
  }

  &.tooltip--left {
    transform: translateY(-50%) translateX(4px);
  }

  &.tooltip--right {
    transform: translateY(-50%) translateX(-4px);
  }
}
</style>
