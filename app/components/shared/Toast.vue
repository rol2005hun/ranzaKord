<script setup lang="ts">
const { toasts, remove } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.variant}`"
          role="alert">
          <div class="toast__icon">
            <svg
              v-if="toast.variant === 'success'"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none">
              <path
                d="M6 10L9 13L14 7"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <svg
              v-else-if="toast.variant === 'danger'"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none">
              <path
                d="M13 7L7 13M7 7L13 13"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <svg
              v-else-if="toast.variant === 'warning'"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none">
              <path
                d="M10 7V10.5M10 13H10.01"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 7V10.5M10 13H10.01"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </div>
          <span class="toast__message">{{ toast.message }}</span>
          <button type="button" class="toast__close" aria-label="Close" @click="remove(toast.id)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.toast-container {
  position: fixed;
  top: var(--toast-offset, var(--space-4));
  right: var(--toast-offset, var(--space-4));
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: var(--z-toast);
  max-width: 24rem;
  width: 100%;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--toast-padding, var(--space-3) var(--space-4));
  border-radius: var(--toast-radius, var(--radius-lg));
  box-shadow: var(--toast-shadow, var(--shadow-lg));
  pointer-events: auto;
  border: 1px solid;

  &--success {
    background-color: var(--color-success-light);
    border-color: var(--color-success);
    color: var(--color-success);
  }

  &--danger {
    background-color: var(--color-danger-light);
    border-color: var(--color-danger);
    color: var(--color-danger);
  }

  &--warning {
    background-color: var(--color-warning-light);
    border-color: var(--color-warning);
    color: var(--color-warning);
  }

  &--info {
    background-color: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text-primary);
  }

  &__icon {
    display: flex;
    flex-shrink: 0;
    margin-top: 1px;
  }

  &__message {
    flex: 1;
    font-size: var(--toast-font-size, var(--text-sm));
    font-weight: var(--font-weight-medium);
    line-height: var(--leading-normal);
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    color: currentColor;
    cursor: pointer;
    opacity: 0.6;
    flex-shrink: 0;
    padding: 0;
    transition: opacity var(--transition-fast);

    &:hover {
      opacity: 1;
    }
  }
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--transition-slow),
    transform var(--transition-slow);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.toast-move {
  transition: transform var(--transition-slow);
}
</style>
