// packages/shared/src/components/Badge.tsx
import React from 'react';
import { cn } from '../utils/cn';

export type BadgeVariant =
  | 'default'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  pulse?: boolean;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-800 border-slate-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-500',
  slate: 'bg-slate-500',
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs font-medium',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  pulse = false,
  dot = false,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors select-none',
        variantClasses[variant],
        sizeClasses[size],
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full shrink-0',
            dotClasses[variant],
            pulse && 'animate-ping'
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
