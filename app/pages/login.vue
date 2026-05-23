<script setup lang="ts">
import type { LoginCredentials } from '~/features/auth/types/auth.types';

definePageMeta({ layout: 'auth' });

const { t } = useI18n();
const { login, isLoading, error } = useAuth();

const form = reactive<LoginCredentials>({
  email: '',
  password: ''
});

async function handleSubmit() {
  await login(form);
}
</script>

<template>
  <section class="login">
    <div class="login__card">
      <h1 class="login__title">{{ t('auth.login.title') }}</h1>

      <form class="login__form" @submit.prevent="handleSubmit">
        <div class="login__field">
          <label for="email" class="login__label">
            {{ t('auth.login.emailLabel') }}
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            :placeholder="t('auth.login.emailPlaceholder')"
            class="login__input"
            required
            autocomplete="email" />
        </div>

        <div class="login__field">
          <label for="password" class="login__label">
            {{ t('auth.login.passwordLabel') }}
          </label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            :placeholder="t('auth.login.passwordPlaceholder')"
            class="login__input"
            required
            autocomplete="current-password" />
        </div>

        <p v-if="error" class="login__error" role="alert">{{ error }}</p>

        <AppButton type="submit" variant="primary" :disabled="isLoading" class="login__submit">
          {{ isLoading ? t('auth.login.submitting') : t('auth.login.submit') }}
        </AppButton>
      </form>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: var(--space-6);
  background-color: var(--color-bg);

  &__card {
    width: 100%;
    max-width: 24rem;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-8) var(--space-6);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  }

  &__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin-bottom: var(--space-6);
    text-align: center;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__label {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  &__input {
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-bg);
    color: var(--color-text-primary);
    font-size: var(--text-base);
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
    }
  }

  &__error {
    font-size: var(--text-sm);
    color: #ef4444;
    text-align: center;
  }

  &__submit {
    width: 100%;
    margin-top: var(--space-2);
  }
}
</style>
