/**
 * Unified Skeleton System
 * 
 * Consistent skeleton loaders with shimmer animation and proper dimensions
 * Ensures no layout shifts when content loads
 * 
 * Requirements: R7.LOADING.SKELETON_CONSISTENCY, R13.COMPONENTS.SINGLE_SKELETON
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant determines the default styling
   */
  variant?: 'default' | 'text' | 'circular' | 'rectangular' | 'card';
  
  /**
   * Animation type
   */
  animation?: 'pulse' | 'wave' | 'none';
  
  /**
   * Width override
   */
  width?: string | number;
  
  /**
   * Height override
   */
  height?: string | number;
  
  /**
   * Number of lines for text variant
   */
  lines?: number;
  
  /**
   * Show shimmer effect
   */
  shimmer?: boolean;
}

/**
 * Base Skeleton component with consistent styling
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className, 
    variant = 'default',
    animation = 'pulse',
    width,
    height,
    lines = 1,
    shimmer = true,
    style,
    ...props 
  }, ref) => {
    const baseClasses = cn(
      // Base styling
      'bg-slate-100 dark:bg-slate-800',
      'relative overflow-hidden',
      
      // Animation classes
      {
        'animate-pulse': animation === 'pulse',
        'animate-none': animation === 'none'
      },
      
      // Variant-specific classes
      {
        'rounded-md': variant === 'default' || variant === 'rectangular',
        'rounded-full': variant === 'circular',
        'rounded-lg': variant === 'card',
        'rounded-sm': variant === 'text'
      },
      
      // Default dimensions by variant
      {
        'h-4': variant === 'text' && !height,
        'h-12 w-12': variant === 'circular' && !width && !height,
        'h-32': variant === 'card' && !height,
        'h-6': variant === 'default' && !height
      },
      
      className
    );

    const inlineStyle = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style
    };

    // Shimmer effect overlay
    const shimmerOverlay = shimmer && animation !== 'none' && (
      <div 
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-r from-transparent via-white/20 to-transparent',
          'dark:via-white/10',
          '-translate-x-full',
          {
            'animate-shimmer': animation === 'wave'
          }
        )}
        style={{
          animation: animation === 'wave' ? 'shimmer 2s infinite' : undefined
        }}
      />
    );

    // Handle multi-line text skeletons
    if (variant === 'text' && lines > 1) {
      return (
        <div className="space-y-2" ref={ref} {...props}>
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={cn(
                baseClasses,
                // Last line is typically shorter
                index === lines - 1 && 'w-3/4'
              )}
              style={inlineStyle}
            >
              {shimmerOverlay}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={baseClasses}
        style={inlineStyle}
        {...props}
      >
        {shimmerOverlay}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

/**
 * Predefined skeleton components for common use cases
 */

export const TextSkeleton = ({ lines = 3, ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton variant="text" lines={lines} {...props} />
);

export const CircularSkeleton = ({ size = 48, ...props }: Omit<SkeletonProps, 'variant'> & { size?: number }) => (
  <Skeleton variant="circular" width={size} height={size} {...props} />
);

export const CardSkeleton = ({ ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton variant="card" {...props} />
);

export const ButtonSkeleton = ({ ...props }: Omit<SkeletonProps, 'variant'>) => (
  <Skeleton className="h-10 w-24 rounded-md" {...props} />
);

/**
 * Complex skeleton layouts
 */

export const OpportunityCardSkeleton = () => (
  <div className="p-4 border border-border rounded-lg space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <CircularSkeleton size={32} />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
    
    <div className="flex justify-between items-center pt-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
  </div>
);

export const FeatureCardSkeleton = () => (
  <div className="p-6 border border-border rounded-lg space-y-4">
    <div className="flex items-center space-x-3">
      <CircularSkeleton size={40} />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
    
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    
    <div className="flex space-x-2 pt-2">
      <ButtonSkeleton />
      <ButtonSkeleton />
    </div>
  </div>
);

export const NavigationSkeleton = () => (
  <div className="flex justify-between items-center p-4">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex flex-col items-center space-y-1">
        <CircularSkeleton size={24} />
        <Skeleton className="h-3 w-12" />
      </div>
    ))}
  </div>
);

// Add shimmer animation to global CSS
const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.querySelector('#skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}