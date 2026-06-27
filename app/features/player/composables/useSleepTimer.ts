import type { SleepTimerMode } from '../types/player.types';

const sleepTimerEndTime = ref<number | null>(null);
const sleepTimerMode = ref<SleepTimerMode>('off');
const sleepTimerRemaining = ref(0);

let tickInterval: ReturnType<typeof setInterval> | null = null;
let pauseCallback: (() => void) | null = null;
let endOfTrackEnabled = false;

function registerPauseCallback(cb: () => void) {
  pauseCallback = cb;
}

function startTimer(minutes: number) {
  clearTimer();
  sleepTimerMode.value = 'timer';
  sleepTimerEndTime.value = Date.now() + minutes * 60 * 1000;

  tickInterval = setInterval(() => {
    const remaining = (sleepTimerEndTime.value ?? 0) - Date.now();
    if (remaining <= 0) {
      sleepTimerRemaining.value = 0;
      clearTimer();
      pauseCallback?.();
    } else {
      sleepTimerRemaining.value = Math.ceil(remaining / 1000);
    }
  }, 1000);

  sleepTimerRemaining.value = minutes * 60;
}

function startEndOfTrack() {
  clearTimer();
  sleepTimerMode.value = 'end-of-track';
  endOfTrackEnabled = true;
}

function clearTimer() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  sleepTimerMode.value = 'off';
  sleepTimerEndTime.value = null;
  sleepTimerRemaining.value = 0;
  endOfTrackEnabled = false;
}

function onTrackEnded() {
  if (endOfTrackEnabled) {
    clearTimer();
    pauseCallback?.();
  }
}

function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function useSleepTimer() {
  return {
    sleepTimerMode: readonly(sleepTimerMode),
    sleepTimerRemaining: readonly(sleepTimerRemaining),
    registerPauseCallback,
    startTimer,
    startEndOfTrack,
    clearTimer,
    onTrackEnded,
    formatRemaining
  };
}
