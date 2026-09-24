// packages/shared/src/components/ToastViewport.tsx
import React from 'react';
import { useToast } from '../state/toastAtom';
import { Alert } from './Alert';
import { cn } from '../utils/cn';

export interface ToastViewportProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

export const ToastViewport: React.FC<ToastViewportProps> = ({
  className,
  position = 'bottom-right',
}) => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Notification Center"
      className={cn(
        'fixed z-50 flex w-full max-w-sm flex-col gap-2.5 pointer-events-none',
        positionClasses[position],
        className
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Alert
            variant={toast.type}
            title={toast.title}
            onDismiss={() => dismiss(toast.id)}
            className="shadow-md"
          >
            {toast.message}
          </Alert>
        </div>
      ))}
    </div>
  );
};
