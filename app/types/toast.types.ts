export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}
