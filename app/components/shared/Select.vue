<script setup lang="ts">
interface SelectOption {
  label: string;
  value: string | number;
}

interface Props {
  modelValue?: string | number;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: undefined,
  disabled: false,
  error: undefined,
  id: undefined
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

function handleChange(event: Event): void {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="select-wrapper">
    <div class="select-container">
      <select
        :id="props.id"
        :value="props.modelValue"
        :disabled="props.disabled"
        :aria-invalid="!!props.error"
        :aria-describedby="props.error && props.id ? `${props.id}-error` : undefined"
        class="select"
        :class="{ 'select--error': props.error, 'select--disabled': props.disabled }"
        @change="handleChange">
        <option v-if="props.placeholder" value="" disabled selected hidden>
          {{ props.placeholder }}
        </option>
        <option v-for="option in props.options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <span class="select-chevron" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </span>
    </div>
    <p
      v-if="props.error"
      :id="props.id ? `${props.id}-error` : undefined"
      class="select-error"
      role="alert">
      {{ props.error }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--select-error-gap, var(--space-1));
}

.select-container {
  position: relative;
  display: flex;
}

.select {
  width: 100%;
  padding: var(--select-padding-y, var(--space-3)) var(--select-padding-x, var(--space-4));
  padding-right: var(--space-10);
  font-size: var(--select-font-size, var(--text-sm));
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  background-color: var(--select-bg, var(--color-surface));
  border: var(--select-border-width, 1px) solid var(--color-border);
  border-radius: var(--select-radius, var(--radius-md));
  cursor: pointer;
  appearance: none;
  transition:
    border-color var(--transition-base),
    box-shadow var(--transition-base);

  &:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px var(--color-ring);
  }

  &--error {
    border-color: var(--color-danger);

    &:focus {
      border-color: var(--color-danger);
      box-shadow: 0 0 0 3px rgb(239 68 68 / 0.25);
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--color-surface-hover);
  }
}

.select-chevron {
  position: absolute;
  right: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
}

.select-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin: 0;
}
</style>
