import { describe, it, expect } from 'vitest';

import { useToast } from '@/composables/useToast';

describe('useToast', () => {
  it('adds and removes a toast', () => {
    const { toasts, add, remove } = useToast();

    while (toasts.value.length > 0) {
      const t = toasts.value[0];
      if (t) remove(t.id);
    }

    expect(toasts.value.length).toBe(0);

    add({ message: 'Test message', duration: 0 });

    expect(toasts.value.length).toBe(1);

    const newToast = toasts.value[0];
    expect(newToast?.message).toBe('Test message');

    if (newToast) {
      remove(newToast.id);
    }

    expect(toasts.value.length).toBe(0);
  });

  it('provides convenience methods', () => {
    const { toasts, success, danger, warning, info, remove } = useToast();

    while (toasts.value.length > 0) {
      const t = toasts.value[0];
      if (t) remove(t.id);
    }

    success('Success!', 0);
    const tSuccess = toasts.value[0];
    expect(tSuccess?.variant).toBe('success');
    if (tSuccess) remove(tSuccess.id);

    danger('Danger!', 0);
    const tDanger = toasts.value[0];
    expect(tDanger?.variant).toBe('danger');
    if (tDanger) remove(tDanger.id);

    warning('Warning!', 0);
    const tWarning = toasts.value[0];
    expect(tWarning?.variant).toBe('warning');
    if (tWarning) remove(tWarning.id);

    info('Info!', 0);
    const tInfo = toasts.value[0];
    expect(tInfo?.variant).toBe('info');
    if (tInfo) remove(tInfo.id);
  });
});
