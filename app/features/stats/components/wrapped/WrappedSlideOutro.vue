<script setup lang="ts">
interface Props {
  onPlayAll: () => void;
  onClose: () => void;
}

defineProps<Props>();
</script>

<template>
  <div class="slide-outro">
    <div class="slide-outro__confetti">
      <span v-for="i in 30" :key="i" class="slide-outro__piece" :style="{ '--i': i }" />
    </div>
    <div class="slide-outro__content">
      <div class="slide-outro__emoji">🎶</div>
      <p class="slide-outro__eyebrow">{{ $t('stats.wrapped.outro.eyebrow') }}</p>
      <h2 class="slide-outro__title">{{ $t('stats.wrapped.outro.title') }}</h2>
      <div class="slide-outro__actions">
        <button id="wrapped-play-all-btn" class="slide-outro__play-btn" @click="onPlayAll()">
          <AppIcon name="ph:play-fill" />
          {{ $t('stats.wrapped.outro.playAll') }}
        </button>
        <button id="wrapped-close-btn" class="slide-outro__close-btn" @click="onClose()">
          {{ $t('stats.wrapped.outro.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.slide-outro {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    hsl(var(--color-primary-h), var(--color-primary-s), 12%) 0%,
    hsl(calc(var(--color-primary-h) + 60), 60%, 10%) 50%,
    hsl(var(--color-primary-h), var(--color-primary-s), 8%) 100%
  );

  &__confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  &__piece {
    position: absolute;
    width: calc(6px + var(--i) * 2px);
    height: calc(6px + var(--i) * 2px);
    border-radius: calc(var(--i) * 1px);
    top: -20px;
    left: calc(var(--i) * 3.3%);
    background: hsl(calc(var(--color-primary-h) + var(--i) * 12), 70%, 65%);
    animation: confetti-fall calc(3s + var(--i) * 0.15s) cubic-bezier(0.25, 0.46, 0.45, 0.94)
      infinite;
    animation-delay: calc(var(--i) * 0.1s);
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--space-8) var(--space-6);
    gap: var(--space-6);
  }

  &__emoji {
    font-size: clamp(3rem, 10vmin, 5rem);
    animation:
      bounce 1s ease-in-out infinite alternate,
      fadeInUp 0.7s both;
  }

  &__eyebrow {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: hsl(var(--color-primary-h), 80%, 70%);
    margin: 0;
    animation: fadeInUp 0.7s 0.1s both;
  }

  &__title {
    font-size: clamp(2rem, 7vw, 4rem);
    font-weight: var(--font-weight-black);
    color: #fff;
    margin: 0;
    line-height: var(--leading-tight);
    animation: fadeInUp 0.7s 0.2s both;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
    max-width: 320px;
    animation: fadeInUp 0.7s 0.35s both;
  }

  &__play-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-4) var(--space-8);
    border-radius: var(--radius-full);
    border: none;
    cursor: pointer;
    font-size: var(--text-base);
    font-weight: var(--font-weight-bold);
    background: linear-gradient(
      135deg,
      hsl(var(--color-primary-h), var(--color-primary-s), 55%) 0%,
      hsl(calc(var(--color-primary-h) + 30), var(--color-primary-s), 50%) 100%
    );
    color: #fff;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 8px 30px hsla(var(--color-primary-h), var(--color-primary-s), 50%, 0.4);

    &:hover {
      transform: scale(1.04);
      box-shadow: 0 12px 40px hsla(var(--color-primary-h), var(--color-primary-s), 50%, 0.6);
    }

    &:active {
      transform: scale(0.97);
    }
  }

  &__close-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.7);
    padding: var(--space-3) var(--space-8);
    border-radius: var(--radius-full);
    cursor: pointer;
    font-size: var(--text-sm);
    font-weight: var(--font-weight-medium);
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.13);
      color: #fff;
    }
  }
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 1;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(110vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes bounce {
  from {
    transform: translateY(0) scale(1);
  }
  to {
    transform: translateY(-12px) scale(1.05);
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
