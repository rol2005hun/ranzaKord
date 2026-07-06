<script setup lang="ts"></script>

<template>
  <div class="slide-intro">
    <div class="slide-intro__aurora">
      <div class="slide-intro__aurora-blob slide-intro__aurora-blob--1" />
      <div class="slide-intro__aurora-blob slide-intro__aurora-blob--2" />
    </div>

    <div class="slide-intro__particles">
      <span v-for="i in 20" :key="i" class="slide-intro__particle" :style="{ '--i': i }" />
    </div>

    <div class="slide-intro__content">
      <div class="slide-intro__logo-wrapper">
        <div class="slide-intro__logo">
          <AppIcon name="ph:vinyl-record-duotone" class="slide-intro__logo-icon" />
        </div>
      </div>
      <p class="slide-intro__eyebrow">{{ $t('stats.wrapped.intro.eyebrow') }}</p>
      <h1 class="slide-intro__title">{{ $t('stats.wrapped.intro.title') }}</h1>
      <p class="slide-intro__subtitle">{{ $t('stats.wrapped.intro.subtitle') }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.slide-intro {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: hsl(var(--color-primary-h), 20%, 5%);

  &__aurora {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }

  &__aurora-blob {
    position: absolute;
    width: 60vw;
    height: 60vw;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    animation: float-aurora 10s ease-in-out infinite alternate;

    &--1 {
      top: -20%;
      left: -10%;
      background: hsla(var(--color-primary-h), 80%, 50%, 0.4);
    }

    &--2 {
      bottom: -20%;
      right: -10%;
      background: hsla(calc(var(--color-primary-h) + 60), 80%, 50%, 0.4);
      animation-delay: -5s;
    }
  }

  &__particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  &__particle {
    position: absolute;
    width: calc(4px + var(--i) * 2px);
    height: calc(4px + var(--i) * 2px);
    border-radius: 50%;
    background: hsla(
      var(--color-primary-h),
      var(--color-primary-s),
      70%,
      calc(0.05 + var(--i) * 0.02)
    );
    left: calc(var(--i) * 5%);
    top: calc(var(--i) * 4% + 10%);
    animation: float calc(4s + var(--i) * 0.3s) ease-in-out infinite alternate;
    animation-delay: calc(var(--i) * -0.2s);
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--space-8);
    animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  &__logo-wrapper {
    position: relative;
    margin-bottom: var(--space-8);
    animation: pulse-glow 3s ease-in-out infinite;
  }

  &__logo {
    width: 140px;
    height: 140px;
    border-radius: var(--radius-full);
    background: linear-gradient(
      135deg,
      hsla(var(--color-primary-h), 80%, 60%, 0.2),
      hsla(var(--color-primary-h), 60%, 40%, 0.05)
    );
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid hsla(var(--color-primary-h), 80%, 70%, 0.4);
    box-shadow: inset 0 0 30px hsla(var(--color-primary-h), 80%, 60%, 0.2);
  }

  &__logo-icon {
    font-size: 5rem;
    color: #fff;
    filter: drop-shadow(0 0 15px hsla(var(--color-primary-h), 80%, 60%, 0.8));
    animation: spin 10s linear infinite;
  }

  &__eyebrow {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: hsl(var(--color-primary-h), var(--color-primary-s), 70%);
    margin: 0 0 var(--space-4);
    animation: fadeInUp 0.8s 0.1s both;
  }

  &__title {
    font-size: clamp(2.5rem, 8vw, 5rem);
    font-weight: var(--font-weight-black);
    color: #fff;
    margin: 0 0 var(--space-4);
    line-height: var(--leading-tight);
    background: linear-gradient(
      135deg,
      #fff 0%,
      hsl(var(--color-primary-h), var(--color-primary-s), 80%) 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: fadeInUp 0.8s 0.2s both;
  }

  &__subtitle {
    font-size: var(--text-lg);
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    animation: fadeInUp 0.8s 0.3s both;
  }
}

@keyframes float {
  from {
    transform: translateY(0) scale(1);
  }
  to {
    transform: translateY(-30px) scale(1.1);
  }
}

@keyframes float-aurora {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(5%, 5%) scale(1.1);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    filter: drop-shadow(0 0 20px hsla(var(--color-primary-h), var(--color-primary-s), 60%, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 60px hsla(var(--color-primary-h), var(--color-primary-s), 60%, 0.6));
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
