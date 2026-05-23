<script setup lang="ts">
interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  id?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: undefined,
  disabled: false,
  error: undefined,
  rows: 4,
  resize: 'vertical',
  id: undefined
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function handleInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}
</script>

<template>
  <div class="textarea-wrapper">
    <textarea
      :id="props.id"
      :value="props.modelValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      :rows="props.rows"
      :aria-invalid="!!props.error"
      :aria-describedby="props.error && props.id ? `${props.id}-error` : undefined"
      class="textarea"
      :class="{ 'textarea--error': props.error, 'textarea--disabled': props.disabled }"
      :style="{ resize: props.resize }"
      @input="handleInput" />
    <p
      v-if="props.error"
      :id="props.id ? `${props.id}-error` : undefined"
      class="textarea-error"
      role="alert">
      {{ props.error }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.textarea-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--textarea-error-gap, var(--space-1));
}

.textarea {
  width: 100%;
  padding: var(--textarea-padding-y, var(--space-3)) var(--textarea-padding-x, var(--space-4));
  font-size: var(--textarea-font-size, var(--text-sm));
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  background-color: var(--textarea-bg, var(--color-surface));
  border: var(--textarea-border-width, 1px) solid var(--color-border);
  border-radius: var(--textarea-radius, var(--radius-md));
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

.textarea-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin: 0;
}
</style>
