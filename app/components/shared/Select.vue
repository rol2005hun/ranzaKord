<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

interface SelectOption {
  label: string;
  value: string | number;
  icon?: string;
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

const isOpen = ref(false);
const selectRef = ref<HTMLElement | null>(null);

const selectedOption = computed(() => {
  return props.options.find((opt) => opt.value === props.modelValue);
});

function toggleDropdown() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function selectOption(option: SelectOption) {
  emit('update:modelValue', option.value);
  isOpen.value = false;
}

function onClickOutside(event: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside);
});
</script>

<template>
  <div ref="selectRef" class="select-wrapper">
    <div
      class="select-container"
      :class="{
        'select-container--disabled': props.disabled,
        'select-container--error': props.error,
        'select-container--open': isOpen
      }"
      :aria-disabled="props.disabled"
      role="button"
      tabindex="0"
      @click="toggleDropdown"
      @keydown.enter.prevent="toggleDropdown"
      @keydown.space.prevent="toggleDropdown">
      <div class="select-trigger">
        <template v-if="selectedOption">
          <AppIcon v-if="selectedOption.icon" :name="selectedOption.icon" class="select-icon" />
          <span class="select-label">{{ selectedOption.label }}</span>
        </template>
        <template v-else-if="props.placeholder">
          <span class="select-placeholder">{{ props.placeholder }}</span>
        </template>
        <template v-else>
          <span class="select-placeholder">&nbsp;</span>
        </template>
      </div>

      <span class="select-chevron" :class="{ 'select-chevron--open': isOpen }">
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

    <Transition name="dropdown">
      <ul v-if="isOpen" class="select-dropdown" role="listbox">
        <li
          v-for="option in props.options"
          :key="option.value"
          class="select-option"
          :class="{ 'select-option--selected': option.value === props.modelValue }"
          role="option"
          :aria-selected="option.value === props.modelValue"
          @click.stop="selectOption(option)">
          <AppIcon v-if="option.icon" :name="option.icon" class="select-option-icon" />
          <span class="select-option-label">{{ option.label }}</span>
          <AppIcon
            v-if="option.value === props.modelValue"
            name="ph:check-bold"
            class="select-option-check" />
        </li>
      </ul>
    </Transition>

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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--select-error-gap, var(--space-1));
  font-family: inherit;
}

.select-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--select-padding-y, var(--space-2)) var(--select-padding-x, var(--space-3));
  font-size: var(--select-font-size, var(--text-sm));
  line-height: var(--leading-normal);
  color: var(--color-text-primary);
  background-color: var(--select-bg, var(--color-surface));
  border: var(--select-border-width, 1px) solid var(--color-border);
  border-radius: var(--select-radius, var(--radius-md));
  cursor: pointer;
  user-select: none;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);

  &:hover {
    border-color: var(--color-border-hover, var(--color-text-secondary));
  }

  &:focus-visible {
    outline: none;
    border-color: var(--color-border-focus, var(--color-primary));
    box-shadow: 0 0 0 3px var(--color-ring);
  }

  &--open {
    border-color: var(--color-border-focus, var(--color-primary));
  }

  &--error {
    border-color: var(--color-danger);

    &:focus-visible {
      border-color: var(--color-danger);
      box-shadow: 0 0 0 3px rgb(239 68 68 / 0.25);
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--color-surface-hover);
    pointer-events: none;
  }
}

.select-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  overflow: hidden;
}

.select-icon {
  font-size: 1.25em;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.select-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-placeholder {
  color: var(--color-text-secondary);
}

.select-chevron {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  transition: transform var(--transition-fast);
  margin-left: var(--space-2);
  flex-shrink: 0;

  &--open {
    transform: rotate(180deg);
  }
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  max-height: 250px;
  overflow-y: auto;
  margin: 0;
  padding: var(--space-1);
  list-style: none;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown, 100);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: var(--radius-full);
  }
}

.select-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--color-surface-hover);
  }

  &--selected {
    color: var(--color-primary);
    background-color: var(
      --color-primary-subtle,
      color-mix(in srgb, var(--color-primary) 10%, transparent)
    );
  }
}

.select-option-icon {
  font-size: 1.25em;
  color: inherit;
  flex-shrink: 0;
}

.select-option-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-option-check {
  font-size: 1em;
  color: var(--color-primary);
  flex-shrink: 0;
}

.select-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin: 0;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  transform-origin: top;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-5px) scaleY(0.95);
}
</style>
