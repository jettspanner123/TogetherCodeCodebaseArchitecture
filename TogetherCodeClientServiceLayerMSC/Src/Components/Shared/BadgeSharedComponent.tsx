import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeSharedComponentProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'userOne' | 'userTwo' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export default function BadgeSharedComponent({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className,
}: BadgeSharedComponentProps): React.JSX.Element {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  };

  const variantStyles = {
    neutral: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    userOne: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    userTwo: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  const dotStyles = {
    neutral: 'bg-neutral-400',
    userOne: 'bg-sky-400',
    userTwo: 'bg-purple-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded-full border tracking-wide uppercase',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
    >
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full animate-pulse', dotStyles[variant])} />}
      {children}
    </span>
  );
}
