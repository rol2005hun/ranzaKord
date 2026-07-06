import type { ToastItem, ToastOptions } from '@/types/toast.types';

const toasts = ref<ToastItem[]>([]);

const DEFAULT_DURATION = 4000;

export function useToast() {
  function add(options: ToastOptions): void {
    const toast: ToastItem = {
      id: crypto.randomUUID(),
      message: options.message,
      variant: options.variant ?? 'info',
      duration: options.duration ?? DEFAULT_DURATION
    };

    toasts.value.push(toast);

    if (toast.duration > 0) {
      setTimeout(() => {
        remove(toast.id);
      }, toast.duration);
    }
  }

  function remove(id: string): void {
    const index = toasts.value.findIndex((t: ToastItem) => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }

  function success(message: string, duration?: number): void {
    add({ message, variant: 'success', duration });
  }

  function danger(message: string, duration?: number): void {
    add({ message, variant: 'danger', duration });
  }

  function warning(message: string, duration?: number): void {
    add({ message, variant: 'warning', duration });
  }

  function info(message: string, duration?: number): void {
    add({ message, variant: 'info', duration });
  }

  return {
    toasts: readonly(toasts),
    add,
    remove,
    success,
    danger,
    warning,
    info
  };
}
