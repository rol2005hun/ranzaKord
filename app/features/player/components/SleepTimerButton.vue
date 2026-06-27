<script setup lang="ts">
const { t } = useI18n();
const {
  sleepTimerMode,
  sleepTimerRemaining,
  startTimer,
  startEndOfTrack,
  clearTimer,
  formatRemaining
} = useSleepTimer();
const { add: addToast } = useToast();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const options = [15, 30, 45, 60];

const isActive = computed(() => sleepTimerMode.value !== 'off');

const statusLabel = computed(() => {
  if (sleepTimerMode.value === 'end-of-track') return t('player.sleepTimerEndOfTrack');
  if (sleepTimerMode.value === 'timer')
    return t('player.sleepTimerActive', { time: formatRemaining(sleepTimerRemaining.value) });
  return null;
});

function toggle() {
  isOpen.value = !isOpen.value;
}

function selectMinutes(minutes: number) {
  startTimer(minutes);
  isOpen.value = false;
  addToast({ message: t('player.sleepTimerSet'), variant: 'success' });
}

function selectEndOfTrack() {
  startEndOfTrack();
  isOpen.value = false;
  addToast({ message: t('player.sleepTimerSet'), variant: 'success' });
}

function handleClear() {
  clearTimer();
  isOpen.value = false;
  addToast({ message: t('player.sleepTimerCleared'), variant: 'info' });
}

onClickOutside(containerRef, () => {
  isOpen.value = false;
});
</script>

<template>
  <div ref="containerRef" class="sleep-timer">
    <button
      class="sleep-timer__btn"
      :class="{ 'sleep-timer__btn--active': isActive }"
      :aria-label="t('player.sleepTimer')"
      :title="statusLabel ?? t('player.sleepTimer')"
      @click="toggle">
      <AppIcon name="ph:moon" />
      <span v-if="isActive && sleepTimerMode === 'timer'" class="sleep-timer__badge">
        {{ formatRemaining(sleepTimerRemaining) }}
      </span>
      <span
        v-else-if="isActive && sleepTimerMode === 'end-of-track'"
        class="sleep-timer__badge sleep-timer__badge--eot">
        <AppIcon name="ph:music-note" />
      </span>
    </button>

    <Transition name="sleep-timer-popup">
      <div v-if="isOpen" class="sleep-timer__popup" role="menu">
        <div class="sleep-timer__popup-header">{{ $t('player.sleepTimer') }}</div>

        <div class="sleep-timer__options">
          <button
            v-for="min in options"
            :key="min"
            class="sleep-timer__option"
            :class="{
              'sleep-timer__option--active':
                sleepTimerMode === 'timer' && Math.round(sleepTimerRemaining / 60) === min
            }"
            role="menuitem"
            @click="selectMinutes(min)">
            {{ $t('player.sleepTimerMinutes', { n: min }) }}
          </button>

          <button
            class="sleep-timer__option"
            :class="{ 'sleep-timer__option--active': sleepTimerMode === 'end-of-track' }"
            role="menuitem"
            @click="selectEndOfTrack">
            <AppIcon name="ph:music-note" />
            {{ $t('player.sleepTimerEndOfTrack') }}
          </button>
        </div>

        <button v-if="isActive" class="sleep-timer__clear" role="menuitem" @click="handleClear">
          <AppIcon name="ph:x-circle" />
          {{ $t('player.sleepTimerOff') }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.sleep-timer {
  position: relative;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1);
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition:
      color 0.15s,
      background 0.15s;
    font-size: 1.25rem;
    height: 32px;
    min-width: 32px;
    justify-content: center;

    &:hover {
      color: var(--color-text-primary);
      background: var(--color-surface-hover);
    }

    &--active {
      color: var(--color-primary);

      &:hover {
        color: var(--color-primary);
      }
    }
  }

  &__badge {
    font-size: 0.6rem;
    font-weight: 700;
    line-height: 1;
    font-family: 'Inter', sans-serif;
    color: var(--color-primary);
    min-width: 28px;
    text-align: left;
  }

  &__popup {
    position: absolute;
    bottom: calc(100% + var(--space-2));
    right: 0;
    z-index: 500;
    background: var(--color-surface-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-2);
    min-width: 160px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);

    &-header {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-muted);
      padding: var(--space-1) var(--space-2);
    }
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: background 0.1s;
    text-align: left;

    &:hover {
      background: var(--color-surface-hover);
    }

    &--active {
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
      color: var(--color-primary);
    }
  }

  &__clear {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.1s;
    margin-top: var(--space-1);

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-text-primary);
    }
  }
}

.sleep-timer-popup-enter-active,
.sleep-timer-popup-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.sleep-timer-popup-enter-from,
.sleep-timer-popup-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
</style>
