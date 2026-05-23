<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  persistent?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  size: 'md',
  persistent: false
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

function close(): void {
  emit('update:modelValue', false);
}

function handleOverlayClick(): void {
  if (!props.persistent) {
    close();
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && !props.persistent) {
    close();
  }
}

watch(
  () => props.modelValue,
  (isOpen: boolean) => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = '';
    }
  }
);

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="props.modelValue" class="modal-overlay" @click.self="handleOverlayClick">
        <div
          class="modal"
          :class="`modal--${props.size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="props.title">
          <div v-if="props.title || $slots.header" class="modal__header">
            <slot name="header">
              <h2 class="modal__title">{{ props.title }}</h2>
            </slot>
            <button type="button" class="modal__close" aria-label="Close" @click="close">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <div class="modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background-color: var(--color-overlay);
  z-index: var(--z-modal);
}

.modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - var(--space-8));
  background-color: var(--modal-bg, var(--color-surface));
  border-radius: var(--modal-radius, var(--radius-lg));
  box-shadow: var(--modal-shadow, var(--shadow-xl));
  overflow: hidden;

  &--sm {
    max-width: var(--modal-width-sm, 24rem);
  }

  &--md {
    max-width: var(--modal-width-md, 32rem);
  }

  &--lg {
    max-width: var(--modal-width-lg, 48rem);
  }

  &--full {
    max-width: calc(100vw - var(--space-8));
    max-height: calc(100vh - var(--space-8));
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--modal-header-padding, var(--space-5) var(--space-6));
    border-bottom: 1px solid var(--color-border);
    gap: var(--space-4);
  }

  &__title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
    line-height: var(--leading-tight);
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    background: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-md);
    transition:
      background-color var(--transition-fast),
      color var(--transition-fast);
    flex-shrink: 0;

    &:hover {
      background-color: var(--color-surface-hover);
      color: var(--color-text-primary);
    }
  }

  &__body {
    padding: var(--modal-body-padding, var(--space-6));
    overflow-y: auto;
    flex: 1;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--modal-footer-padding, var(--space-4) var(--space-6));
    border-top: 1px solid var(--color-border);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition:
    opacity var(--transition-base),
    transform var(--transition-base);
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform var(--transition-base);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal {
  transform: scale(0.95) translateY(0.5rem);
}

.modal-leave-to .modal {
  transform: scale(0.95) translateY(0.5rem);
}
</style>
