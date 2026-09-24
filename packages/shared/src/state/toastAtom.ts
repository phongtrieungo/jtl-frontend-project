// packages/shared/src/state/toastAtom.ts
import { useCallback } from 'react';
import { atom, useAtom } from 'jotai';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

/**
 * Global reactive list of active toasts.
 */
export const toastsAtom = atom<Toast[]>([]);

/**
 * Convenience alias for architectural spec alignment.
 */
export const toastListAtom = toastsAtom;

/**
 * Hook for dispatching and dismissing accessible toast notifications.
 */
export function useToast() {
  const [toasts, setToasts] = useAtom(toastsAtom);

  const dismiss = useCallback(
    (id: string) => {
      setToasts((current) => current.filter((t) => t.id !== id));
    },
    [setToasts]
  );

  const showToast = useCallback(
    (options: ToastOptions | string): string => {
      const opts: ToastOptions =
        typeof options === 'string' ? { message: options, type: 'info' } : options;

      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const durationMs = opts.durationMs ?? 4000;

      const newToast: Toast = {
        id,
        type: opts.type ?? 'info',
        title: opts.title,
        message: opts.message,
        durationMs,
      };

      setToasts((current) => [...current, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== id));
        }, durationMs);
      }

      return id;
    },
    [setToasts]
  );

  const success = useCallback(
    (message: string, title?: string, durationMs?: number) =>
      showToast({ type: 'success', message, title, durationMs }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, durationMs?: number) =>
      showToast({ type: 'error', message, title, durationMs }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string, durationMs?: number) =>
      showToast({ type: 'warning', message, title, durationMs }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, durationMs?: number) =>
      showToast({ type: 'info', message, title, durationMs }),
    [showToast]
  );

  return {
    toasts,
    toast: showToast,
    dismiss,
    success,
    error,
    warning,
    info,
  };
}
