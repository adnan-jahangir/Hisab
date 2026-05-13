import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Skeleton } from './Skeleton';
import { GlassCard } from './GlassCard';

export interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  loading?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  prefix = '',
  suffix = '',
  trend = 'neutral',
  trendValue,
  icon: Icon,
  variant = 'primary',
  loading = false,
  className,
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!loading) {
      const controls = animate(0, value, {
        duration: 1.5,
        ease: 'easeOut',
        onUpdate: (v) => setDisplayValue(v),
      });
      return () => controls.stop();
    }
  }, [value, loading]);

  const variantColors = {
    primary: 'text-accent-primary bg-accent-primary/10',
    success: 'text-success bg-success/10',
    danger: 'text-danger bg-danger/10',
    warning: 'text-warning bg-warning/10',
  };

  return (
    <GlassCard gradient={variant} hover className={cn('p-6', className)}>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text-primary">
                {prefix}
                {displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {suffix}
              </span>
            </div>
          )}
          
          {trendValue !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  'flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
                  trend === 'up' && 'text-success bg-success/10',
                  trend === 'down' && 'text-danger bg-danger/10',
                  trend === 'neutral' && 'text-text-secondary bg-text-muted/10'
                )}
              >
                {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                {trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                {trend === 'neutral' && <Minus className="w-3 h-3 mr-1" />}
                {Math.abs(trendValue)}%
              </span>
              <span className="text-xs text-text-muted">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={cn('p-3 rounded-2xl shadow-sm', variantColors[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* Decorative background element for extra depth */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl bg-current pointer-events-none" style={{ color: variant === 'primary' ? 'var(--accent-primary)' : 'var(--' + variant + ')' }} />
    </GlassCard>
  );
}
