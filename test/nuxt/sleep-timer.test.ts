import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSleepTimer } from '@/features/player/composables/useSleepTimer';

describe('useSleepTimer', () => {
  const {
    sleepTimerMode,
    sleepTimerRemaining,
    registerPauseCallback,
    startTimer,
    startEndOfTrack,
    clearTimer,
    onTrackEnded,
    formatRemaining
  } = useSleepTimer();

  beforeEach(() => {
    vi.useFakeTimers();
    clearTimer();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('starts with off mode', () => {
    expect(sleepTimerMode.value).toBe('off');
    expect(sleepTimerRemaining.value).toBe(0);
  });

  it('starts a timer and updates remaining time', () => {
    startTimer(5); // 5 minutes
    expect(sleepTimerMode.value).toBe('timer');
    expect(sleepTimerRemaining.value).toBe(300); // 5 * 60 seconds

    vi.advanceTimersByTime(1000);
    expect(sleepTimerRemaining.value).toBe(299);

    vi.advanceTimersByTime(59000); // Advance by another 59 seconds
    expect(sleepTimerRemaining.value).toBe(240); // 4 minutes left
  });

  it('calls pause callback when timer expires', () => {
    const mockPause = vi.fn();
    registerPauseCallback(mockPause);

    startTimer(1); // 1 minute
    expect(sleepTimerMode.value).toBe('timer');

    vi.advanceTimersByTime(60000); // Advance 1 minute

    expect(mockPause).toHaveBeenCalledOnce();
    expect(sleepTimerMode.value).toBe('off');
    expect(sleepTimerRemaining.value).toBe(0);
  });

  it('handles end-of-track mode correctly', () => {
    const mockPause = vi.fn();
    registerPauseCallback(mockPause);

    startEndOfTrack();
    expect(sleepTimerMode.value).toBe('end-of-track');

    // Simulate track ending
    onTrackEnded();

    expect(mockPause).toHaveBeenCalledOnce();
    expect(sleepTimerMode.value).toBe('off');
  });

  it('does not trigger end-of-track if not enabled', () => {
    const mockPause = vi.fn();
    registerPauseCallback(mockPause);

    // Track ends, but mode is off
    onTrackEnded();
    expect(mockPause).not.toHaveBeenCalled();
  });

  it('formats remaining time correctly', () => {
    expect(formatRemaining(60)).toBe('1:00');
    expect(formatRemaining(65)).toBe('1:05');
    expect(formatRemaining(3599)).toBe('59:59');
    expect(formatRemaining(5)).toBe('0:05');
    expect(formatRemaining(0)).toBe('0:00');
  });

  it('clears timer correctly', () => {
    startTimer(10);
    expect(sleepTimerMode.value).toBe('timer');
    clearTimer();
    expect(sleepTimerMode.value).toBe('off');
    expect(sleepTimerRemaining.value).toBe(0);
  });
});
