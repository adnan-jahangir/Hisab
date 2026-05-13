import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
  ...props
}: BadgeProps) {
  const variants = {
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    danger: 'bg-danger/10 text-danger border border-danger/20',
    info: 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20',
    default: 'bg-bg-elevated text-text-secondary border border-border',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            variant === 'default' ? 'bg-text-secondary' : 'bg-current'
          )}
        />
      )}
      {children}
    </span>
  );
}