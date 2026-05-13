import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'none';
}

export function Skeleton({
  className,
  width,
  height,
  rounded = 'md',
  style,
  ...props
}: SkeletonProps) {
  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-bg-elevated via-bg-surface to-bg-elevated bg-[length:400%_100%]',
        radiusClasses[rounded],
        className
      )}
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
        ...style,
      }}
      {...props}
    />
  );
}