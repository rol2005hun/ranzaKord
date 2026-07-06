<script setup lang="ts">
interface Props {
  totalSeconds: number;
}

const props = defineProps<Props>();

const hours = computed(() => Math.floor(props.totalSeconds / 3600));
const minutes = computed(() => Math.floor((props.totalSeconds % 3600) / 60));
</script>

<template>
  <div class="slide-time">
    <div class="slide-time__bg-rings">
      <span v-for="i in 5" :key="i" class="slide-time__ring" :style="{ '--i': i }" />
    </div>
    <div class="slide-time__content">
      <p class="slide-time__eyebrow">{{ $t('stats.wrapped.totalTime.eyebrow') }}</p>
      <div class="slide-time__numbers">
        <div v-if="hours > 0" class="slide-time__number-block">
          <span class="slide-time__number">{{ hours }}</span>
          <span class="slide-time__unit">{{ $t('stats.hours') }}</span>
        </div>
        <div class="slide-time__number-block">
          <span class="slide-time__number">{{ minutes }}</span>
          <span class="slide-time__unit">{{ $t('stats.minutes') }}</span>
        </div>
      </div>
      <p class="slide-time__suffix">{{ $t('stats.wrapped.totalTime.suffix') }}</p>
      <div class="slide-time__wave">
        <span v-for="i in 40" :key="i" class="slide-time__wave-bar" :style="{ '--i': i }" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.slide-time {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(
    160deg,
    hsl(260, 60%, 10%) 0%,
    hsl(280, 50%, 8%) 50%,
    hsl(240, 60%, 12%) 100%
  );

  &__bg-rings {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  &__ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid hsla(var(--color-primary-h), 60%, 60%, calc(0.15 - var(--i) * 0.025));
    width: calc(var(--i) * 18vmin);
    height: calc(var(--i) * 18vmin);
    animation: ring-pulse calc(3s + var(--i) * 0.5s) ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.3s);
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: var(--space-8);
    gap: var(--space-6);
  }

  &__eyebrow {
    font-size: var(--text-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
    animation: fadeInUp 0.7s both;
  }

  &__numbers {
    display: flex;
    gap: var(--space-8);
    align-items: flex-end;
    animation: fadeInUp 0.7s 0.15s both;
  }

  &__number-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
  }

  &__number {
    font-size: clamp(4rem, 15vw, 9rem);
    font-weight: var(--font-weight-black);
    line-height: 1;
    background: linear-gradient(
      135deg,
      hsl(var(--color-primary-h), var(--color-primary-s), 80%) 0%,
      hsl(calc(var(--color-primary-h) + 60), 80%, 75%) 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 30px hsla(var(--color-primary-h), 80%, 60%, 0.4));
  }

  &__unit {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-semibold);
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__suffix {
    font-size: var(--text-xl);
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-weight: var(--font-weight-medium);
    animation: fadeInUp 0.7s 0.3s both;
  }

  &__wave {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 60px;
    animation: fadeInUp 0.7s 0.45s both;
  }

  &__wave-bar {
    width: 4px;
    border-radius: 2px;
    background: hsla(var(--color-primary-h), var(--color-primary-s), 65%, 0.6);
    height: calc(20% + sin(var(--i)) * 80%);
    animation: wave-anim calc(1.2s + var(--i) * 0.05s) ease-in-out infinite alternate;
    animation-delay: calc(var(--i) * 0.04s);
    min-height: 4px;
  }
}

@keyframes ring-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.03);
    opacity: 1;
  }
}

@keyframes wave-anim {
  from {
    height: 8px;
  }
  to {
    height: calc(20px + var(--i) * 1.5px);
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
