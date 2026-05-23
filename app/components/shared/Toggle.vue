<script setup lang="ts">
interface Props {
  modelValue?: boolean;
  label?: string;
  disabled?: boolean;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  label: undefined,
  disabled: false,
  id: undefined
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function toggle(): void {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue);
  }
}
</script>

<template>
  <label class="toggle" :class="{ 'toggle--disabled': props.disabled }">
    <input
      :id="props.id"
      type="checkbox"
      role="switch"
      :checked="props.modelValue"
      :disabled="props.disabled"
      :aria-checked="props.modelValue"
      class="toggle__input"
      @change="toggle" />
    <span class="toggle__track" :class="{ 'toggle__track--active': props.modelValue }">
      <span class="toggle__thumb" />
    </span>
    <span v-if="props.label" class="toggle__label">{{ props.label }}</span>
  </label>
</template>

<style scoped lang="scss">
.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--toggle-gap, var(--space-3));
  cursor: pointer;
  user-select: none;

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;

    &:focus-visible + .toggle__track {
      box-shadow: 0 0 0 3px var(--color-ring);
    }
  }

  &__track {
    position: relative;
    width: var(--toggle-width, 2.75rem);
    height: var(--toggle-height, 1.5rem);
    background-color: var(--color-border);
    border-radius: var(--radius-full);
    transition: background-color var(--transition-base);
    flex-shrink: 0;

    &--active {
      background-color: var(--color-primary);
    }
  }

  &__thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: calc(var(--toggle-height, 1.5rem) - 4px);
    height: calc(var(--toggle-height, 1.5rem) - 4px);
    background-color: #ffffff;
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-sm);
    transition: transform var(--transition-base);

    .toggle__track--active & {
      transform: translateX(calc(var(--toggle-width, 2.75rem) - var(--toggle-height, 1.5rem)));
    }
  }

  &__label {
    font-size: var(--toggle-label-size, var(--text-sm));
    color: var(--color-text-primary);
    line-height: var(--leading-normal);
  }
}
</style>
