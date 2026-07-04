<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';

definePageMeta({
  layout: 'auth'
});

const { t, locale, setLocale } = useI18n({ useScope: 'global' });
useHead({ title: t('core.nav.signIn') });

const { loginWithRanzaKonnect, isAuthenticated, isTauri } = useAuth();
const themeStore = useThemeStore();
const isRedirecting = ref(false);
const rememberMe = ref(false);

const redirectingText = computed(() =>
  isTauri.value ? t('auth.login.openingInBrowser') : t('auth.login.redirecting')
);

const handleLogin = () => {
  isRedirecting.value = true;
  loginWithRanzaKonnect(rememberMe.value);
};

const handleWindowFocus = () => {
  if (isRedirecting.value && isTauri.value) {
    isRedirecting.value = false;
  }
};

let unlistenTauriFocus: (() => void) | null = null;

onMounted(async () => {
  if (import.meta.client) {
    window.addEventListener('focus', handleWindowFocus);

    if (isTauri.value) {
      unlistenTauriFocus = await getCurrentWindow().onFocusChanged(({ payload: focused }) => {
        if (focused && isRedirecting.value) {
          isRedirecting.value = false;
        }
      });
    }
  }
});

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('focus', handleWindowFocus);
    if (unlistenTauriFocus) {
      unlistenTauriFocus();
    }
  }
});

if (isAuthenticated.value) {
  await navigateTo('/');
}
</script>

<template>
  <div id="main-content" class="login-page">
    <div class="login-page__lang-toggle">
      <button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
      <button :class="{ active: locale === 'hu' }" @click="setLocale('hu')">HU</button>
    </div>

    <div
      class="login-page__card"
      :class="{ 'login-page__card--hidden': themeStore.themeId === 'wc2026' }">
      <div class="login-page__logo">
        <AppIcon name="ph:music-note-fill" class="login-page__logo-icon" />
        <span class="login-page__logo-text">{{ $t('core.appName') }}</span>
      </div>

      <h1 class="login-page__title">
        {{ $t('auth.login.title') }}
      </h1>
      <p class="login-page__subtitle">{{ $t('auth.login.subtitle') }}</p>

      <div class="login-page__remember">
        <label class="login-page__remember-label">
          <input v-model="rememberMe" type="checkbox" class="login-page__remember-checkbox" />
          <span>{{ $t('auth.login.rememberMe') }}</span>
        </label>
      </div>

      <AppButton
        id="login-with-ranzakonnect"
        class="login-page__btn"
        :disabled="isRedirecting"
        size="lg"
        @click="handleLogin">
        <template v-if="isRedirecting">
          <AppSpinner size="sm" class="login-page__spinner" />
          {{ redirectingText }}
        </template>
        <template v-else>
          <AppIcon name="ph:key-fill" />
          {{ $t('auth.login.button') }}
        </template>
      </AppButton>

      <p class="login-page__footer">{{ $t('auth.login.footer') }}</p>
    </div>

    <div v-if="themeStore.themeId === 'wc2026'" class="wc-stadium__cta">
      <div class="login-page__remember login-page__remember--wc">
        <label class="login-page__remember-label">
          <input v-model="rememberMe" type="checkbox" class="login-page__remember-checkbox" />
          <span>{{ $t('auth.login.rememberMe') }}</span>
        </label>
      </div>
      <AppButton
        id="login-with-ranzakonnect-wc"
        class="wc-stadium__cta-btn"
        :disabled="isRedirecting"
        size="lg"
        @click="handleLogin">
        <template v-if="isRedirecting">
          <AppSpinner size="sm" />
          {{ redirectingText }}
        </template>
        <template v-else>
          <AppIcon name="ph:key-fill" />
          {{ $t('auth.login.button') }}
        </template>
      </AppButton>
    </div>

    <div class="login-page__bg">
      <div class="login-page__orb login-page__orb--1" />
      <div class="login-page__orb login-page__orb--2" />
      <div class="login-page__orb login-page__orb--3" />
    </div>

    <div v-if="themeStore.themeId === 'wc2026'" class="wc-stadium" aria-hidden="true">
      <!-- Stadium stands as CSS divs for proper visual appearance -->
      <div class="wc-stadium__stands" />
      <div class="wc-stadium__crowd" />

      <div class="wc-stadium__pitch-wrapper">
        <svg
          class="wc-stadium__pitch"
          viewBox="0 0 1280 640"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grass" width="100" height="640" patternUnits="userSpaceOnUse">
              <rect width="50" height="640" fill="#0b2b1c" />
              <rect x="50" width="50" height="640" fill="#092416" />
            </pattern>
          </defs>

          <rect width="1280" height="640" fill="url(#grass)" />

          <g stroke="#ffffff" fill="none" stroke-width="3" opacity="0.6">
            <!-- Main pitch outline (added 60px X margin and 40px Y margin) -->
            <rect x="60" y="40" width="1160" height="560" />

            <line x1="640" y1="40" x2="640" y2="600" />
            <circle cx="640" cy="320" r="90" />
            <circle cx="640" cy="320" r="4" fill="#ffffff" />

            <!-- Left side -->
            <rect x="60" y="160" width="160" height="320" />
            <rect x="60" y="240" width="50" height="160" />
            <circle cx="150" cy="320" r="4" fill="#ffffff" />
            <path d="M 220 255 A 90 90 0 0 1 220 385" />
            <!-- Left Goal (starts at 30, depth 30, ends at pitch line 60) -->
            <rect x="30" y="280" width="30" height="80" stroke-width="2" />
            <line x1="30" y1="290" x2="60" y2="290" stroke-width="1" opacity="0.5" />
            <line x1="30" y1="302" x2="60" y2="302" stroke-width="1" opacity="0.5" />
            <line x1="30" y1="314" x2="60" y2="314" stroke-width="1" opacity="0.5" />
            <line x1="30" y1="326" x2="60" y2="326" stroke-width="1" opacity="0.5" />
            <line x1="30" y1="338" x2="60" y2="338" stroke-width="1" opacity="0.5" />
            <line x1="30" y1="350" x2="60" y2="350" stroke-width="1" opacity="0.5" />

            <!-- Right side -->
            <rect x="1060" y="160" width="160" height="320" />
            <rect x="1170" y="240" width="50" height="160" />
            <circle cx="1130" cy="320" r="4" fill="#ffffff" />
            <path d="M 1060 255 A 90 90 0 0 0 1060 385" />
            <!-- Right Goal (starts at pitch line 1220, depth 30, ends at 1250) -->
            <rect x="1220" y="280" width="30" height="80" stroke-width="2" />
            <line x1="1220" y1="290" x2="1250" y2="290" stroke-width="1" opacity="0.5" />
            <line x1="1220" y1="302" x2="1250" y2="302" stroke-width="1" opacity="0.5" />
            <line x1="1220" y1="314" x2="1250" y2="314" stroke-width="1" opacity="0.5" />
            <line x1="1220" y1="326" x2="1250" y2="326" stroke-width="1" opacity="0.5" />
            <line x1="1220" y1="338" x2="1250" y2="338" stroke-width="1" opacity="0.5" />
            <line x1="1220" y1="350" x2="1250" y2="350" stroke-width="1" opacity="0.5" />
          </g>
        </svg>

        <!-- Full 11v11 Teams -->
        <div
          v-for="i in 11"
          :key="'a' + i"
          :class="['wc-stadium__player', 'wc-stadium__player--a' + i]" />
        <div
          v-for="i in 11"
          :key="'b' + i"
          :class="['wc-stadium__player', 'wc-stadium__player--b' + i]" />

        <div class="wc-stadium__ball" />
        <div class="wc-stadium__spotlight wc-stadium__spotlight--1" />
        <div class="wc-stadium__spotlight wc-stadium__spotlight--2" />
        <div class="wc-stadium__spotlight wc-stadium__spotlight--3" />
        <div class="wc-stadium__spotlight wc-stadium__spotlight--4" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg);
  position: relative;
  overflow: hidden;

  &__remember {
    width: 100%;
    margin-top: var(--space-2);
    margin-bottom: var(--space-2);

    &--wc {
      margin: 0;
      .login-page__remember-label {
        color: rgba(255, 255, 255, 0.85);
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);

        &:hover {
          color: white;
        }
      }
    }
  }

  &__remember-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    cursor: pointer;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    user-select: none;
    transition: color var(--transition-base);

    &:hover {
      color: var(--color-text-primary);
    }
  }

  &__remember-checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--color-primary);
  }

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
    background: var(--login-logo-gradient, linear-gradient(135deg, #a855f7 0%, #38bdf8 100%));
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
    width: 100%;
  }

  &__spinner {
    --spinner-color: currentColor;
  }

  &__footer {
    font-size: var(--text-xs);
    color: var(--color-text-secondary, #9090b0);
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
    transform: translateZ(0);

    &--1 {
      width: 500px;
      height: 500px;
      background: var(
        --login-orb-1,
        radial-gradient(circle, hsl(265 75% 40% / 0.15) 0%, transparent 60%)
      );
      top: -150px;
      left: -150px;
    }

    &--2 {
      width: 400px;
      height: 400px;
      background: var(
        --login-orb-2,
        radial-gradient(circle, hsl(195 80% 40% / 0.12) 0%, transparent 60%)
      );
      bottom: -100px;
      right: -100px;
    }

    &--3 {
      width: 300px;
      height: 300px;
      background: var(
        --login-orb-3,
        radial-gradient(circle, hsl(265 75% 50% / 0.08) 0%, transparent 60%)
      );
      bottom: 20%;
      left: 30%;
    }
  }
  &__lang-toggle {
    position: absolute;
    top: calc(var(--safe-area-top, 0px) + var(--space-4));
    right: var(--space-4);
    display: flex;
    gap: var(--space-1);
    z-index: 10;
    background: var(--color-surface-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-full);
    padding: var(--space-1);
    backdrop-filter: blur(12px);

    button {
      padding: var(--space-1) var(--space-3);
      font-size: var(--text-xs);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-secondary);
      border-radius: var(--radius-full);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all var(--transition-base);

      &:hover {
        color: var(--color-text-primary);
      }

      &.active {
        color: var(--color-text-primary);
        background: var(--color-surface-hover);
        box-shadow: var(--shadow-sm);
      }
    }
  }
}

.wc-stadium {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: max(100vw, 177.78vh);
  height: max(56.25vw, 100vh);
  pointer-events: none;
  z-index: 0;
  overflow: hidden;

  &__pitch-wrapper {
    position: absolute;
    top: 10%;
    bottom: 10%;
    left: 5%;
    right: 5%;
    border-radius: 60px;
    overflow: hidden;
    z-index: 2;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
  }

  &__pitch {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  &__crowd {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    /* Simulated crowd camera flashes using box-shadows */
    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 3px;
      height: 3px;
      background: white;
      border-radius: 50%;
      opacity: 0;
    }
    &::before {
      top: 5%;
      left: 20%;
      box-shadow:
        100px 20px white,
        300px -10px white,
        500px 50px white,
        700px -20px white,
        50px 90vh white,
        250px 95vh white,
        450px 92vh white,
        650px 88vh white;
      animation: flash-stadium 3s infinite;
    }
    &::after {
      top: 5%;
      right: 20%;
      box-shadow:
        -150px 10px white,
        -350px 40px white,
        -550px -10px white,
        -750px 30px white,
        -100px 90vh white,
        -300px 94vh white,
        -500px 91vh white,
        -700px 87vh white;
      animation: flash-stadium 4.5s infinite 1.5s;
    }
  }

  &__spotlight {
    position: absolute;
    top: -60px;
    width: 180px;
    height: 600px;
    background: linear-gradient(to bottom, hsl(158 85% 60% / 0.12) 0%, transparent 70%);
    transform-origin: top center;
    border-radius: 0 0 50% 50%;
    animation: spotlight-sweep 8s ease-in-out infinite alternate;
    z-index: 2;

    &--1 {
      left: 5%;
      animation-delay: 0s;
    }
    &--2 {
      left: 25%;
      animation-delay: 2s;
      animation-duration: 10s;
    }
    &--3 {
      right: 25%;
      animation-delay: 1s;
      animation-duration: 9s;
    }
    &--4 {
      right: 5%;
      animation-delay: 3s;
    }
  }

  &__player {
    position: absolute;
    width: 8px;
    height: 18px;
    border-radius: 4px 4px 0 0;
    z-index: 3;
    transform: translate(-50%, -50%);

    &::before {
      content: '';
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    &--a1 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 0.3s;
    }
    &--b1 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 0.2s;
    }
    &--a2 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 0.6s;
    }
    &--b2 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 0.4s;
    }
    &--a3 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 0.9s;
    }
    &--b3 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 0.6s;
    }
    &--a4 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 1.2s;
    }
    &--b4 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 0.8s;
    }
    &--a5 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 1.5s;
    }
    &--b5 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 1s;
    }
    &--a6 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 1.8s;
    }
    &--b6 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 1.2s;
    }
    &--a7 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 2.1s;
    }
    &--b7 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 1.4s;
    }
    &--a8 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 2.4s;
    }
    &--b8 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 1.6s;
    }
    &--a9 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 2.7s;
    }
    &--b9 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 1.8s;
    }
    &--a10 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 3s;
    }
    &--b10 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 2s;
    }
    &--a11 {
      background: hsl(158, 85%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(158, 85%, 50%, 0.5);
      &::before {
        background: hsl(158, 85%, 75%);
      }
      animation: player-hover 4s infinite alternate ease-in-out 3.3s;
    }
    &--b11 {
      background: hsl(0, 80%, 65%, 0.9);
      box-shadow: 0 0 6px hsl(0, 80%, 50%, 0.5);
      &::before {
        background: hsl(0, 80%, 75%);
      }
      animation: player-hover 5s infinite alternate ease-in-out 2.2s;
    }

    /* Formations */
    &--a1 {
      left: 6%;
      top: 50%;
    }
    &--a2 {
      left: 22%;
      top: 30%;
    }
    &--a3 {
      left: 20%;
      top: 45%;
    }
    &--a4 {
      left: 20%;
      top: 55%;
    }
    &--a5 {
      left: 22%;
      top: 70%;
    }
    &--a6 {
      left: 35%;
      top: 35%;
    }
    &--a7 {
      left: 32%;
      top: 50%;
    }
    &--a8 {
      left: 35%;
      top: 65%;
    }
    &--a9 {
      left: 45%;
      top: 30%;
    }
    &--a10 {
      left: 42%;
      top: 50%;
    }
    &--a11 {
      left: 45%;
      top: 70%;
    }

    &--b1 {
      right: 6%;
      top: 50%;
    }
    &--b2 {
      right: 22%;
      top: 30%;
    }
    &--b3 {
      right: 20%;
      top: 45%;
    }
    &--b4 {
      right: 20%;
      top: 55%;
    }
    &--b5 {
      right: 22%;
      top: 70%;
    }
    &--b6 {
      right: 35%;
      top: 35%;
    }
    &--b7 {
      right: 32%;
      top: 50%;
    }
    &--b8 {
      right: 35%;
      top: 65%;
    }
    &--b9 {
      right: 45%;
      top: 30%;
    }
    &--b10 {
      right: 42%;
      top: 50%;
    }
    &--b11 {
      right: 45%;
      top: 70%;
    }
  }

  &__ball {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #ffffff, #cccccc);
    box-shadow:
      0 0 8px hsl(158 85% 60% / 0.6),
      0 2px 4px rgb(0 0 0 / 0.5);
    z-index: 3;
    animation: pass-ball 8s infinite ease-out;
  }
}

@keyframes flash-stadium {
  0%,
  95% {
    opacity: 0;
  }
  96% {
    opacity: 1;
  }
  97% {
    opacity: 0;
  }
  98% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
  }
}

@keyframes spotlight-sweep {
  from {
    transform: rotate(-15deg);
    opacity: 0.6;
  }
  to {
    transform: rotate(15deg);
    opacity: 1;
  }
}

@keyframes player-hover {
  0% {
    transform: translate(-50%, -50%);
  }
  33% {
    transform: translate(calc(-50% + 15px), calc(-50% - 10px));
  }
  66% {
    transform: translate(calc(-50% - 5px), calc(-50% + 15px));
  }
  100% {
    transform: translate(calc(-50% + 5px), calc(-50% + 5px));
  }
}

@keyframes pass-ball {
  /* Pass sequence mapping to player coords:
     Start A9 -> A7 -> B6 (intercept) -> B10 -> Shot to A1 */
  0% {
    left: 48%;
    top: 30%;
  }
  20% {
    left: 48%;
    top: 30%;
  }

  25% {
    left: 32%;
    top: 50%;
  }
  45% {
    left: 32%;
    top: 50%;
  }

  50% {
    left: 65%;
    top: 25%;
  } /* B6 is right: 35%, which is left 65% */
  70% {
    left: 65%;
    top: 25%;
  }

  75% {
    left: 55%;
    top: 50%;
  } /* B10 is right: 45%, which is left: 55% */
  90% {
    left: 55%;
    top: 50%;
  }

  95% {
    left: 6%;
    top: 50%;
  } /* Goal attempt at A1 */
  100% {
    left: 6%;
    top: 50%;
    opacity: 0;
  }
}

/* WC2026 Specific Integration */
[data-theme='wc2026'] .login-page__card--hidden {
  display: none;
}

.wc-stadium__cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6) var(--space-10) var(--space-8);
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.85) 0%,
    rgba(0, 0, 0, 0.5) 60%,
    transparent 100%
  );

  &-logo {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: hsl(var(--color-primary-h) var(--color-primary-s) 70%);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
    letter-spacing: 0.04em;

    .app-icon {
      font-size: 1.3rem;
    }
  }

  &-btn {
    min-width: 320px;
    font-size: 1.05rem;
    letter-spacing: 0.03em;
  }
}
</style>
