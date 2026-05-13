import React, { ButtonHTMLAttributes } from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-accent-primary text-white hover:bg-accent-dark focus:ring-accent-primary shadow-glow',
      secondary: 'bg-bg-elevated text-text-primary border border-border hover:bg-border focus:ring-border',
      ghost: 'text-text-primary hover:bg-bg-elevated focus:ring-bg-elevated',
      danger: 'bg-danger text-white hover:bg-danger/90 focus:ring-danger shadow-glow-danger',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && Icon && iconPosition === 'left' && (
          <Icon className="mr-2 h-4 w-4" />
        )}
        {children}
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className="ml-2 h-4 w-4" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';