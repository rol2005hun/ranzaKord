<script setup lang="ts">
definePageMeta({
  layout: 'auth'
});

const { t } = useI18n();
useHead({ title: t('nav.signIn') });

const { loginWithRanzaKonnect, isAuthenticated } = useAuth();

if (isAuthenticated.value) {
  await navigateTo('/');
}
</script>

<template>
  <div class="login-page">
    <div class="login-page__card">
      <div class="login-page__logo">
        <AppIcon name="ph:music-note-fill" class="login-page__logo-icon" />
        <span class="login-page__logo-text">{{ $t('appName') }}</span>
      </div>

      <h1 class="login-page__title">{{ $t('auth.login.title') }}</h1>
      <p class="login-page__subtitle">{{ $t('auth.login.subtitle') }}</p>

      <button id="login-with-ranzakonnect" class="login-page__btn" @click="loginWithRanzaKonnect">
        <AppIcon name="ph:key-fill" />
        {{ $t('auth.login.button') }}
      </button>

      <p class="login-page__footer">{{ $t('auth.login.footer') }}</p>
    </div>

    <div class="login-page__bg">
      <div class="login-page__orb login-page__orb--1" />
      <div class="login-page__orb login-page__orb--2" />
      <div class="login-page__orb login-page__orb--3" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg, #09090f);
  overflow: hidden;

  &__card {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-12) var(--space-10);
    background: var(--color-surface-glass, var(--color-surface));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    backdrop-filter: blur(24px);
    max-width: 420px;
    width: 100%;
    text-align: center;
    box-shadow: 0 0 80px rgb(0 0 0 / 0.4);
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
  }

  &__logo-icon {
    font-size: 2.5rem;
    color: var(--color-primary, #7c3aed);
  }

  &__logo-text {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(135deg, #a855f7 0%, #38bdf8 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary, #e8e8f0);
    line-height: var(--leading-tight);
  }

  &__subtitle {
    font-size: var(--text-base);
    color: var(--color-text-secondary, #9090b0);
  }

  &__btn {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-4) var(--space-6);
    background: var(--color-primary, #7c3aed);
    color: #ffffff;
    border: none;
    border-radius: var(--radius-lg);
    font-size: var(--text-base);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-sans, sans-serif);
    cursor: pointer;
    justify-content: center;
    transition:
      background var(--transition-fast),
      transform var(--transition-fast),
      box-shadow var(--transition-fast);

    &:hover {
      background: var(--color-primary-hover, #6d28d9);
      transform: translateY(-2px);
      box-shadow: 0 0 30px rgb(124 58 237 / 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &__footer {
    font-size: var(--text-xs);
    color: var(--color-text-disabled, #4a4a6a);
    margin-top: var(--space-2);
  }

  &__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__orb {
    position: absolute;
    border-radius: var(--radius-full);
    filter: blur(80px);

    &--1 {
      width: 400px;
      height: 400px;
      background: hsl(265 75% 40% / 0.2);
      top: -100px;
      left: -100px;
    }

    &--2 {
      width: 300px;
      height: 300px;
      background: hsl(195 80% 40% / 0.15);
      bottom: -80px;
      right: -80px;
    }

    &--3 {
      width: 200px;
      height: 200px;
      background: hsl(265 75% 50% / 0.1);
      bottom: 20%;
      left: 30%;
    }
  }
}
</style>
