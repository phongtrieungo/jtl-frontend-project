// packages/shared/src/components/Input.tsx
import React, { forwardRef, useId } from 'react';
import { cn } from '../utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id: customId,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    // Determine aria-describedby target
    const describedBy = error
      ? errorId
      : helperText
        ? helperId
        : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            className={cn(
              'block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error
                ? 'border-rose-300 text-rose-900 focus-visible:border-rose-500 focus-visible:ring-rose-500'
                : 'border-slate-300 focus-visible:border-indigo-600 focus-visible:ring-indigo-600',
              disabled && 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-sm font-medium text-rose-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-sm text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
