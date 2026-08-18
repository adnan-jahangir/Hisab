import React, { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'prefix'> {
  label?: string;
  error?: string;
  prefix?: any;
  hint?: string;
  options?: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, prefix, hint, id, options, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const renderPrefix = () => {
      if (!prefix) return null;
      if (React.isValidElement(prefix)) return prefix;
      if (typeof prefix === 'function' || (typeof prefix === 'object' && prefix !== null)) {
        const IconComponent = prefix as any;
        return <IconComponent className="h-5 w-5" />;
      }
      return <span>{String(prefix)}</span>;
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block mb-1.5 text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted z-10">
              {renderPrefix()}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full bg-bg-elevated border rounded-lg text-text-primary text-sm transition-colors appearance-none cursor-pointer',
              'focus:outline-none focus:ring-1',
              prefix ? 'pl-10' : 'pl-3',
              'pr-10 py-2.5',
              error
                ? 'border-danger focus:border-danger focus:ring-danger'
                : 'border-border focus:border-accent-primary focus:ring-accent-primary',
              className
            )}
            {...props}
          >
            {children ? (
              children
            ) : (
              options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
            <ChevronDown className="h-4 w-4" />
          </div>
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

Select.displayName = 'Select';