<script setup lang="ts"></script>

<template>
  <div class="slide-intro">
    <div class="slide-intro__particles">
      <span v-for="i in 20" :key="i" class="slide-intro__particle" :style="{ '--i': i }" />
    </div>
    <div class="slide-intro__content">
      <div class="slide-intro__logo">
        <AppIcon name="ph:music-notes-fill" class="slide-intro__logo-icon" />
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
  background: linear-gradient(
    135deg,
    hsl(var(--color-primary-h), var(--color-primary-s), 15%) 0%,
    hsl(calc(var(--color-primary-h) + 40), var(--color-primary-s), 10%) 50%,
    hsl(calc(var(--color-primary-h) - 20), var(--color-primary-s), 8%) 100%
  );

  &__particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
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

  &__logo {
    width: 100px;
    height: 100px;
    border-radius: var(--radius-full);
    background: hsla(var(--color-primary-h), var(--color-primary-s), 60%, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-8);
    animation: pulse-glow 2s ease-in-out infinite;
    border: 1px solid hsla(var(--color-primary-h), var(--color-primary-s), 60%, 0.3);
  }

  &__logo-icon {
    font-size: 3rem;
    color: hsl(var(--color-primary-h), var(--color-primary-s), 75%);
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

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 20px hsla(var(--color-primary-h), var(--color-primary-s), 60%, 0.2);
  }
  50% {
    box-shadow: 0 0 50px hsla(var(--color-primary-h), var(--color-primary-s), 60%, 0.5);
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
