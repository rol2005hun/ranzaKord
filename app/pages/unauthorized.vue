<script setup lang="ts">
definePageMeta({
  layout: 'auth'
});

const { t } = useI18n();
useHead({ title: t('auth.unauthorized.title') });

const { logout, isTauri } = useAuth();
const isLoggingOut = ref(false);

const redirectingText = computed(() =>
  isTauri.value ? t('auth.login.openingInBrowser') : t('auth.login.redirecting')
);

const handleLogout = async () => {
  isLoggingOut.value = true;
  await logout();
};
</script>

<template>
  <div id="main-content" class="login-page">
    <div class="login-page__card">
      <div class="login-page__logo">
        <AppIcon
          name="ph:shield-warning-fill"
          class="login-page__logo-icon login-page__logo-icon--warning" />
      </div>

      <h1 class="login-page__title">{{ $t('auth.unauthorized.title') }}</h1>

      <div class="login-page__message">
        <p>{{ $t('auth.unauthorized.message') }}</p>
        <p>{{ $t('auth.unauthorized.opensource') }}</p>

        <a
          href="https://github.com/rol2005hun/ranzaKord"
          target="_blank"
          rel="noopener noreferrer"
          class="login-page__github-link">
          <AppIcon name="mdi:github" />
          {{ $t('auth.unauthorized.github') }}
        </a>
      </div>

      <AppButton
        id="logout-btn"
        class="login-page__btn"
        variant="secondary"
        :disabled="isLoggingOut"
        size="lg"
        @click="handleLogout">
        <template v-if="isLoggingOut">
          <AppSpinner size="sm" class="login-page__spinner" />
          {{ redirectingText }}
        </template>
        <template v-else>
          <AppIcon name="ph:sign-out-fill" />
          {{ $t('core.nav.signOut') }}
        </template>
      </AppButton>
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
    -webkit-backdrop-filter: blur(24px);
    transform: translateZ(0);
    max-width: 460px;
    width: 100%;
    text-align: center;
    box-shadow: 0 0 80px rgb(0 0 0 / 0.4);
  }

  &__logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: var(--radius-full);
    background: hsl(0 80% 50% / 0.1);
    margin-bottom: var(--space-2);
  }

  &__logo-icon {
    font-size: 3rem;
    color: var(--color-primary, #7c3aed);

    &--warning {
      color: hsl(0 80% 60%);
    }
  }

  &__title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary, #e8e8f0);
    line-height: var(--leading-tight);
  }

  &__message {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    font-size: var(--text-base);
    color: var(--color-text-secondary, #9090b0);
    line-height: var(--leading-relaxed);
  }

  &__github-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    margin-top: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    transition: all 0.2s ease;

    &:hover {
      background: var(--color-surface-hover);
      border-color: var(--color-border-hover);
      transform: translateY(-2px);
    }

    .icon {
      font-size: 1.25rem;
    }
  }

  &__btn {
    width: 100%;
    margin-top: var(--space-2);
  }

  &__spinner {
    --spinner-color: currentColor;
  }

  &__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__orb {
    position: absolute;
    border-radius: var(--radius-full);
    transform: translateZ(0);

    &--1 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, hsl(0 75% 40% / 0.1) 0%, transparent 60%);
      top: -150px;
      left: -150px;
    }

    &--2 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, hsl(30 80% 40% / 0.1) 0%, transparent 60%);
      bottom: -100px;
      right: -100px;
    }

    &--3 {
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, hsl(0 75% 50% / 0.05) 0%, transparent 60%);
      bottom: 20%;
      left: 30%;
    }
  }
}
</style>
