<script setup lang="ts">
interface Props {
  modelValue?: string | number;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: undefined,
  disabled: false,
  error: undefined,
  id: undefined
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', props.type === 'number' ? Number(target.value) : target.value);
}
</script>

<template>
  <div class="input-wrapper">
    <input
      :id="props.id"
      :type="props.type"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :aria-invalid="!!props.error"
      :aria-describedby="props.error && props.id ? `${props.id}-error` : undefined"
      class="input"
      :class="{ 'input--error': props.error, 'input--disabled': props.disabled }"
      @input="handleInput" />
    <p
      v-if="props.error"
      :id="props.id ? `${props.id}-error` : undefined"
      class="input-error"
      role="alert">
      {{ props.error }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--input-error-gap, var(--space-1));
}

.input {
  width: 100%;
  padding: var(--input-padding-y, var(--space-3)) var(--input-padding-x, var(--space-4));
  font-size: var(--input-font-size, var(--text-sm));
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  background-color: var(--input-bg, var(--color-surface));
  border: var(--input-border-width, 1px) solid var(--color-border);
  border-radius: var(--input-radius, var(--radius-md));
  transition:
    border-color var(--transition-base),
    box-shadow var(--transition-base);
  appearance: none;

  &::placeholder {
    color: var(--color-text-secondary);
  }

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

.input-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin: 0;
}
</style>
