<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void;
}>();
</script>

<template>
  <div class="terms-modal-overlay" @click.self="emit('close')">
    <div class="terms-modal">
      <div class="terms-modal__header">
        <h2 class="terms-modal__title">{{ $t('auth.login.termsModalTitle') }}</h2>
        <button class="terms-modal__close" @click="emit('close')">
          <AppIcon name="ph:x" />
        </button>
      </div>
      <div class="terms-modal__content">
        <h3>{{ $t('auth.login.terms.introTitle') }}</h3>
        <p>{{ $t('auth.login.terms.introText') }}</p>

        <h3>{{ $t('auth.login.terms.usageTitle') }}</h3>
        <p>{{ $t('auth.login.terms.usageText') }}</p>

        <h3>{{ $t('auth.login.terms.privacyTitle') }}</h3>
        <p>{{ $t('auth.login.terms.privacyText') }}</p>

        <h3>{{ $t('auth.login.terms.disclaimerTitle') }}</h3>
        <p>{{ $t('auth.login.terms.disclaimerText') }}</p>

        <!-- Placeholder disclaimer text -->
        <p>
          <i>{{ $t('auth.login.terms.placeholder') }}</i>
        </p>
      </div>
      <div class="terms-modal__footer">
        <AppButton @click="emit('close')">{{ $t('core.actions.confirm') }}</AppButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.terms-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.terms-modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-raised);
  }

  &__title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
  }

  &__close {
    background: transparent;
    border: none;
    color: var(--color-text-secondary);
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1);
    border-radius: var(--radius-full);
    transition: all var(--transition-fast);

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-hover);
    }
  }

  &__content {
    padding: var(--space-6);
    overflow-y: auto;
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
    line-height: 1.6;
    flex: 1;

    h3 {
      color: var(--color-text-primary);
      font-size: var(--text-base);
      margin-top: var(--space-4);
      margin-bottom: var(--space-2);

      &:first-child {
        margin-top: 0;
      }
    }

    p {
      margin-bottom: var(--space-4);
    }
  }

  &__footer {
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
    background: var(--color-surface-raised);
  }
}
</style>
