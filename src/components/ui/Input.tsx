import React, { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  prefix?: any;
  suffix?: any;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, suffix, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const renderPrefix = () => {
      if (!prefix) return null;
      if (React.isValidElement(prefix)) return prefix;
      if (typeof prefix === 'function' || (typeof prefix === 'object' && prefix !== null)) {
        const IconComponent = prefix as any;
        return <IconComponent className="h-5 w-5" />;
      }
      return <span>{String(prefix)}</span>;
    };

    const renderSuffix = () => {
      if (!suffix) return null;
      if (React.isValidElement(suffix)) return suffix;
      if (typeof suffix === 'function' || (typeof suffix === 'object' && suffix !== null)) {
        const IconComponent = suffix as any;
        return <IconComponent className="h-5 w-5" />;
      }
      return <span>{String(suffix)}</span>;
    };

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
              {renderPrefix()}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-bg-elevated border rounded-lg text-text-primary text-sm transition-colors',
              'focus:outline-none focus:ring-1',
              prefix ? 'pl-10' : 'pl-3',
              suffix ? 'pr-10' : 'pr-3',
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
              {renderSuffix()}
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