<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

interface Props {
  variant?: 'mixes' | 'radios' | 'tracks';
}

withDefaults(defineProps<Props>(), {
  variant: 'tracks'
});

const trackRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function updateScrollState() {
  const el = trackRef.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 10;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 10;
}

function scroll(direction: 'left' | 'right') {
  const el = trackRef.value;
  if (!el) return;
  const scrollAmount = Math.max(280, el.clientWidth * 0.75);
  el.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth'
  });
}

let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;

onMounted(() => {
  const el = trackRef.value;
  if (!el) return;
  el.addEventListener('scroll', updateScrollState, { passive: true });
  nextTick(() => updateScrollState());

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);
  }

  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(() => {
      updateScrollState();
    });
    mutationObserver.observe(el, { childList: true, subtree: true });
  }

  window.addEventListener('resize', updateScrollState);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  mutationObserver?.disconnect();
  const el = trackRef.value;
  if (el) {
    el.removeEventListener('scroll', updateScrollState);
  }
  window.removeEventListener('resize', updateScrollState);
});
</script>

<template>
  <div class="home-slider" :class="`home-slider--${variant}`">
    <button
      v-show="canScrollLeft"
      type="button"
      class="home-slider__btn home-slider__btn--left"
      :aria-label="$t('home.scrollLeft')"
      @click="scroll('left')">
      <AppIcon name="ph:caret-left-bold" />
    </button>

    <div ref="trackRef" class="home-slider__track">
      <slot />
    </div>

    <button
      v-show="canScrollRight"
      type="button"
      class="home-slider__btn home-slider__btn--right"
      :aria-label="$t('home.scrollRight')"
      @click="scroll('right')">
      <AppIcon name="ph:caret-right-bold" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.home-slider {
  position: relative;
  width: 100%;

  &__track {
    display: flex;
    gap: var(--space-4);
    overflow-x: auto;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    padding: var(--space-2) 0 var(--space-4);

    &::-webkit-scrollbar {
      display: none;
    }

    :deep(> *) {
      flex: 0 0 auto;
      scroll-snap-align: start;
    }
  }

  &--mixes,
  &--radios {
    :deep(.home-mix-card),
    :deep(.home-radio-card),
    :deep(.home-dashboard__mix-skeleton) {
      width: 210px;
    }
  }

  &--tracks {
    :deep(.track-card),
    :deep(.home-dashboard__skeleton) {
      width: 165px;
    }
  }

  &__btn {
    position: absolute;
    top: calc(50% - var(--space-2));
    transform: translateY(-50%);
    z-index: 10;
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    background: rgba(18, 18, 18, 0.88);
    border: 1px solid var(--color-border);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: var(--text-lg);
    opacity: 0.9;
    transition:
      background var(--transition-fast),
      transform var(--transition-fast),
      color var(--transition-fast),
      box-shadow var(--transition-fast),
      opacity var(--transition-fast);

    &:hover {
      opacity: 1;
      background: var(--color-surface-hover);
      color: var(--color-primary);
      transform: translateY(-50%) scale(1.12);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7);
    }

    &--left {
      left: calc(var(--space-2) * -1);
    }

    &--right {
      right: calc(var(--space-2) * -1);
    }
  }
}

@media (max-width: 768px) {
  .home-slider {
    &--mixes,
    &--radios {
      :deep(.home-mix-card),
      :deep(.home-radio-card),
      :deep(.home-dashboard__mix-skeleton) {
        width: 170px;
      }
    }

    &--tracks {
      :deep(.track-card),
      :deep(.home-dashboard__skeleton) {
        width: 135px;
      }
    }

    &__btn {
      display: none;
    }
  }
}
</style>
