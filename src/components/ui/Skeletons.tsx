import React, { useEffect, useState } from 'react';

/**
 * Base Skeleton component with prefers-reduced-motion support
 */
interface SkeletonProps {
  className?: string;
  'aria-label'?: string;
}

const Skeleton = ({ className = '', 'aria-label': ariaLabel }: SkeletonProps) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div
      className={`
        bg-slate-700/50 rounded
        ${prefersReducedMotion ? '' : 'animate-pulse'}
        ${className}
      `}
      aria-label={ariaLabel || 'Loading...'}
      role="status"
    />
  );
};

/**
 * Feature Card Skeleton
 * Matches dimensions of FeatureCard component
 */
export const FeatureCardSkeleton = () => {
  return (
    <div
      className="
        bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6
        flex flex-col gap-4
      "
      aria-label="Loading feature card"
      role="status"
    >
      {/* Icon placeholder */}
      <Skeleton className="w-12 h-12 rounded-lg" aria-label="Loading icon" />
      
      {/* Title */}
      <Skeleton className="h-6 w-32" aria-label="Loading title" />
      
      {/* Tagline */}
      <Skeleton className="h-4 w-48" aria-label="Loading tagline" />
      
      {/* Preview metric */}
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-24" aria-label="Loading metric label" />
        <Skeleton className="h-8 w-20" aria-label="Loading metric value" />
        <Skeleton className="h-3 w-40" aria-label="Loading metric description" />
      </div>
      
      {/* Buttons */}
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-10 flex-1" aria-label="Loading primary button" />
        <Skeleton className="h-10 w-24" aria-label="Loading secondary button" />
      </div>
    </div>
  );
};

/**
 * Trust Stats Skeleton
 * Matches dimensions of TrustBuilders stats section
 */
export const TrustStatsSkeleton = () => {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
      aria-label="Loading trust statistics"
      role="status"
    >
      {/* Stat 1 */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-24 mx-auto" aria-label="Loading stat value" />
        <Skeleton className="h-4 w-32 mx-auto" aria-label="Loading stat label" />
      </div>
      
      {/* Stat 2 */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-24 mx-auto" aria-label="Loading stat value" />
        <Skeleton className="h-4 w-32 mx-auto" aria-label="Loading stat label" />
      </div>
      
      {/* Stat 3 */}
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-24 mx-auto" aria-label="Loading stat value" />
        <Skeleton className="h-4 w-32 mx-auto" aria-label="Loading stat label" />
      </div>
    </div>
  );
};

/**
 * Onboarding Steps Skeleton
 * Matches dimensions of OnboardingSection steps
 */
export const OnboardingStepsSkeleton = () => {
  return (
    <div
      className="flex flex-col md:flex-row gap-6 md:gap-8"
      aria-label="Loading onboarding steps"
      role="status"
    >
      {/* Step 1 */}
      <div className="flex-1 space-y-3">
        <Skeleton className="w-8 h-8 rounded-full" aria-label="Loading step number" />
        <Skeleton className="h-5 w-32" aria-label="Loading step title" />
        <Skeleton className="h-4 w-full" aria-label="Loading step description" />
        <Skeleton className="h-3 w-3/4" aria-label="Loading step description line 2" />
      </div>
      
      {/* Step 2 */}
      <div className="flex-1 space-y-3">
        <Skeleton className="w-8 h-8 rounded-full" aria-label="Loading step number" />
        <Skeleton className="h-5 w-32" aria-label="Loading step title" />
        <Skeleton className="h-4 w-full" aria-label="Loading step description" />
        <Skeleton className="h-3 w-3/4" aria-label="Loading step description line 2" />
      </div>
      
      {/* Step 3 */}
      <div className="flex-1 space-y-3">
        <Skeleton className="w-8 h-8 rounded-full" aria-label="Loading step number" />
        <Skeleton className="h-5 w-32" aria-label="Loading step title" />
        <Skeleton className="h-4 w-full" aria-label="Loading step description" />
        <Skeleton className="h-3 w-3/4" aria-label="Loading step description line 2" />
      </div>
    </div>
  );
};

/**
 * Generic skeleton for custom use cases
 */
export { Skeleton };
