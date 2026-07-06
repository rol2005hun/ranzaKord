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
const btnRef = ref<HTMLElement | null>(null);
const popupRef = ref<HTMLElement | null>(null);

const options = [15, 30, 45, 60];

const isActive = computed(() => sleepTimerMode.value !== 'off');

const statusLabel = computed(() => {
  if (sleepTimerMode.value === 'end-of-track') return t('player.sleepTimerEndOfTrack');
  if (sleepTimerMode.value === 'timer')
    return t('player.sleepTimerActive', { time: formatRemaining(sleepTimerRemaining.value) });
  return null;
});

const popupStyle = ref<{ bottom: string; right: string }>({ bottom: '0px', right: '0px' });

function updatePopupPosition() {
  if (!btnRef.value) return;
  const rect = btnRef.value.getBoundingClientRect();
  popupStyle.value = {
    bottom: `${window.innerHeight - rect.top + 8}px`,
    right: `${window.innerWidth - rect.right}px`
  };
}

function toggle() {
  if (!isOpen.value) {
    updatePopupPosition();
  }
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

onClickOutside(containerRef, (event) => {
  if (popupRef.value?.contains(event.target as Node)) return;
  isOpen.value = false;
});
</script>

<template>
  <div ref="containerRef" class="sleep-timer">
    <button
      ref="btnRef"
      class="sleep-timer__btn"
      :class="{ 'sleep-timer__btn--active': isActive }"
      :aria-label="t('player.sleepTimer')"
      :title="statusLabel ?? t('player.sleepTimer')"
      @click="toggle">
      <AppIcon name="ph:moon" />
      <span v-if="isActive && sleepTimerMode === 'timer'" class="sleep-timer__badge">
        {{ formatRemaining(sleepTimerRemaining) }}
      </span>
    </button>

    <Teleport to="body">
      <Transition name="sleep-timer-popup">
        <div
          v-if="isOpen"
          ref="popupRef"
          class="sleep-timer__popup"
          :style="popupStyle"
          role="menu">
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
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.sleep-timer {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    border-radius: var(--radius-full);
    transition:
      color var(--transition-fast),
      transform var(--transition-fast);
    font-size: var(--text-xl);
    width: 32px;
    height: 32px;
    position: relative;

    &:hover {
      color: var(--color-text-primary);
      transform: scale(1.05);
    }

    &--active {
      color: var(--color-primary);

      &:hover {
        color: var(--color-primary);
      }

      &::after {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--color-primary);
      }
    }
  }

  &__badge {
    position: absolute;
    bottom: 2px;
    right: -2px;
    font-size: 0.5rem;
    font-weight: 700;
    line-height: 1;
    font-family: 'Inter', sans-serif;
    color: var(--color-primary);
    background: var(--color-surface);
    border-radius: var(--radius-sm);
    padding: 1px 2px;
    pointer-events: none;
    white-space: nowrap;
  }
}

.sleep-timer__popup {
  position: fixed;
  z-index: 99999;
  background: var(--color-surface-raised);
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

.sleep-timer__options {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sleep-timer__option {
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

.sleep-timer__clear {
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
