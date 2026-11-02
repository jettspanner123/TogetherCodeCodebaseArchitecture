import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputSharedComponentProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function InputSharedComponent({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...rest
}: InputSharedComponentProps): React.JSX.Element {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-neutral-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-neutral-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={twMerge(
            clsx(
              'w-full bg-neutral-900 border rounded-lg px-3.5 py-2 text-sm text-neutral-100 placeholder-neutral-500 transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500',
              error ? 'border-rose-500 focus:ring-rose-500' : 'border-neutral-800 hover:border-neutral-700',
              leftIcon ? 'pl-9' : '',
              rightIcon ? 'pr-9' : '',
              className
            )
          )}
          {...rest}
        />
        {rightIcon && (
          <div className="absolute right-3 text-neutral-400 pointer-events-none flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <span className="text-xs text-rose-400 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-neutral-500">{helperText}</span>
      ) : null}
    </div>
  );
}
