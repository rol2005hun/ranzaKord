import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useToast } from '../../app/composables/useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset global state
    const { toasts, remove } = useToast();
    [...toasts.value].forEach((t) => remove(t.id));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('adds and removes a toast manually', () => {
    const { toasts, add, remove } = useToast();
    expect(toasts.value.length).toBe(0);

    add({ message: 'Test message', duration: 0 }); // 0 means no auto-remove
    expect(toasts.value.length).toBe(1);
    expect(toasts.value[0]?.message).toBe('Test message');
    expect(toasts.value[0]?.variant).toBe('info');

    remove(toasts.value[0]?.id as string);
    expect(toasts.value.length).toBe(0);
  });

  it('auto-removes toast after duration', () => {
    const { toasts, add } = useToast();
    add({ message: 'Auto remove', duration: 1000 });

    expect(toasts.value.length).toBe(1);

    vi.advanceTimersByTime(500);
    expect(toasts.value.length).toBe(1);

    vi.advanceTimersByTime(501);
    expect(toasts.value.length).toBe(0);
  });

  it('provides shorthand methods', () => {
    const { toasts, success, danger, warning, info, remove } = useToast();

    success('Success', 0);
    danger('Danger', 0);
    warning('Warning', 0);
    info('Info', 0);

    expect(toasts.value.length).toBe(4);
    expect(toasts.value[0]?.variant).toBe('success');
    expect(toasts.value[1]?.variant).toBe('danger');
    expect(toasts.value[2]?.variant).toBe('warning');
    expect(toasts.value[3]?.variant).toBe('info');

    [...toasts.value].forEach((t) => remove(t.id));
  });

  it('uses default duration', () => {
    const { toasts, info } = useToast();
    info('Default duration');
    expect(toasts.value.length).toBe(1);
    expect(toasts.value[0]?.duration).toBe(4000);
  });
});
