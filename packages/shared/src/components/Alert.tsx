// packages/shared/src/components/Alert.tsx
import React from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
  action?: React.ReactNode;
}

const variantStyles: Record<
  AlertVariant,
  {
    container: string;
    icon: React.ElementType;
    iconColor: string;
    titleColor: string;
  }
> = {
  info: {
    container: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    icon: Info,
    iconColor: 'text-indigo-600',
    titleColor: 'text-indigo-950',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-950',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-950',
  },
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: AlertCircle,
    iconColor: 'text-rose-600',
    titleColor: 'text-rose-950',
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  onDismiss,
  action,
  className,
  children,
  ...props
}) => {
  const config = variantStyles[variant];
  const Icon = config.icon;
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={cn(
        'relative flex w-full gap-3.5 rounded-xl border p-4 text-sm shadow-sm transition-all',
        config.container,
        className
      )}
      {...props}
    >
      <Icon
        className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)}
        aria-hidden="true"
      />

      <div className="flex-1 space-y-1">
        {title && (
          <h5 className={cn('font-semibold leading-tight', config.titleColor)}>
            {title}
          </h5>
        )}
        <div className="leading-relaxed">{children}</div>
        {action && <div className="pt-2">{action}</div>}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
