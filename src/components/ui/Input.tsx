import React, { InputHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: LucideIcon | string;
  suffix?: LucideIcon | string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, suffix, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const PrefixComponent = typeof prefix === 'string' ? null : prefix;
    const SuffixComponent = typeof suffix === 'string' ? null : suffix;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              {PrefixComponent ? <PrefixComponent className="h-5 w-5" /> : <span>{prefix}</span>}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-bg-elevated border rounded-lg text-text-primary text-sm transition-colors',
              'focus:outline-none focus:ring-1',
              prefix ? (typeof prefix === 'string' ? 'pl-8' : 'pl-10') : 'pl-3',
              suffix ? (typeof suffix === 'string' ? 'pr-8' : 'pr-10') : 'pr-3',
              'py-2.5',
              error
                ? 'border-danger focus:border-danger focus:ring-danger'
                : 'border-border focus:border-accent-primary focus:ring-accent-primary',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
              {SuffixComponent ? <SuffixComponent className="h-5 w-5" /> : <span>{suffix}</span>}
            </div>
          )}
        </div>
        {(error || hint) && (
          <p
            className={cn(
              'mt-1.5 text-xs',
              error ? 'text-danger' : 'text-text-muted'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';