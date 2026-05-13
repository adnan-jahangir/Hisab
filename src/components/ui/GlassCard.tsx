import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
  gradient?: 'none' | 'primary' | 'success' | 'danger' | 'warning';
  delay?: number;
}

export function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
  gradient = 'none',
  delay = 0,
  ...props
}: GlassCardProps) {
  const gradientClasses = {
    none: 'bg-white/70 dark:bg-slate-800/80',
    primary: 'bg-gradient-to-br from-accent-primary/10 to-white/50 dark:from-accent-primary/20 dark:to-slate-800/80',
    success: 'bg-gradient-to-br from-success/10 to-white/50 dark:from-success/20 dark:to-slate-800/80',
    danger: 'bg-gradient-to-br from-danger/10 to-white/50 dark:from-danger/20 dark:to-slate-800/80',
    warning: 'bg-gradient-to-br from-warning/10 to-white/50 dark:from-warning/20 dark:to-slate-800/80',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'relative overflow-hidden rounded-[24px] backdrop-blur-2xl',
        'border border-white/50 dark:border-slate-700/60',
        'shadow-[8px_8px_32px_rgba(0,0,0,0.05),-8px_-8px_32px_rgba(255,255,255,0.7)] dark:shadow-[8px_8px_32px_rgba(0,0,0,0.2),-8px_-8px_32px_rgba(255,255,255,0.02)]',
        // Internal subtle highlight for deep carved effect
        'before:absolute before:inset-0 before:rounded-[24px] before:border-2 before:border-white/70 before:pointer-events-none dark:before:border-white/10',
        gradientClasses[gradient],
        // Deep carved hover float effect
        hover && 'transition-all duration-400 ease-out hover:shadow-[12px_20px_40px_rgba(108,99,255,0.15),-12px_-20px_40px_rgba(255,255,255,0.8)] dark:hover:shadow-[12px_20px_40px_rgba(108,99,255,0.2),-12px_-20px_40px_rgba(255,255,255,0.01)] hover:border-accent-primary/50 hover:-translate-y-2 hover:scale-[1.02]',
        glow && 'shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
