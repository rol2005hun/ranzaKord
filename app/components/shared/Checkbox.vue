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
  <label class="checkbox" :class="{ 'checkbox--disabled': props.disabled }">
    <input
      :id="props.id"
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled"
      class="checkbox__input"
      @change="toggle" />
    <span class="checkbox__box" :class="{ 'checkbox__box--checked': props.modelValue }">
      <svg
        v-if="props.modelValue"
        class="checkbox__icon"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.5 8.5L6.5 11.5L12.5 4.5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round" />
      </svg>
    </span>
    <span v-if="props.label" class="checkbox__label">{{ props.label }}</span>
  </label>
</template>

<style scoped lang="scss">
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--checkbox-gap, var(--space-2));
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

    &:focus-visible + .checkbox__box {
      box-shadow: 0 0 0 3px var(--color-ring);
    }
  }

  &__box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--checkbox-size, 1.125rem);
    height: var(--checkbox-size, 1.125rem);
    border: var(--checkbox-border-width, 2px) solid var(--color-border);
    border-radius: var(--checkbox-radius, var(--radius-sm));
    background-color: var(--color-surface);
    color: var(--color-primary-foreground);
    transition:
      background-color var(--transition-fast),
      border-color var(--transition-fast);
    flex-shrink: 0;

    &--checked {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
    }
  }

  &__icon {
    width: 0.75rem;
    height: 0.75rem;
  }

  &__label {
    font-size: var(--checkbox-label-size, var(--text-sm));
    color: var(--color-text-primary);
    line-height: var(--leading-normal);
  }
}
</style>
