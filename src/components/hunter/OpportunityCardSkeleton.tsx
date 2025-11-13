/**
 * OpportunityCardSkeleton Component
 * 
 * Skeleton loading state for OpportunityCard during feed refresh.
 * Matches the Hunter Feed pattern with shimmer animation.
 * 
 * Features:
 * - Shimmer animation effect
 * - Matches OpportunityCard layout
 * - Light and dark theme support
 * - Respects prefers-reduced-motion
 * 
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 53
 * @see .kiro/specs/hunter-screen-feed/requirements.md - Requirement 18.13
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface OpportunityCardSkeletonProps {
  isDarkTheme?: boolean;
  className?: string;
}

export function OpportunityCardSkeleton({ 
  isDarkTheme = true,
  className 
}: OpportunityCardSkeletonProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-lg rounded-[20px] p-6 animate-pulse',
        isDarkTheme 
          ? 'bg-white/5' 
          : 'bg-white/90 shadow-[0_4px_12px_rgba(0,0,0,0.05)]',
        className
      )}
      role="status"
      aria-label="Loading opportunity"
    >
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-3 flex-1">
          {/* Type Badge */}
          <div className={cn(
            'h-5 rounded-full w-20',
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
          )} />
          
          {/* Title */}
          <div className={cn(
            'h-6 rounded w-2/3',
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
          )} />
          
          {/* Description */}
          <div className="space-y-2">
            <div className={cn(
              'h-4 rounded w-full',
              isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
            )} />
            <div className={cn(
              'h-4 rounded w-4/5',
              isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
            )} />
          </div>
        </div>
        
        {/* Guardian Score */}
        <div className={cn(
          'h-10 rounded-lg w-24',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
      </div>

      {/* Metadata Section */}
      <div className="flex gap-2 mb-4">
        <div className={cn(
          'h-6 rounded w-24',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
        <div className={cn(
          'h-6 rounded w-20',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
        <div className={cn(
          'h-6 rounded w-16',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
      </div>

      {/* Action Button */}
      <div className={cn(
        'h-10 rounded-lg w-full',
        isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
      )} />

      {/* Screen reader text */}
      <span className="sr-only">Loading opportunity card</span>
    </div>
  );
}

/**
 * OpportunityGridSkeleton Component
 * 
 * Grid of skeleton cards for initial load or feed refresh.
 */
interface OpportunityGridSkeletonProps {
  count?: number;
  isDarkTheme?: boolean;
  className?: string;
}

export function OpportunityGridSkeleton({ 
  count = 3,
  isDarkTheme = true,
  className 
}: OpportunityGridSkeletonProps) {
  return (
    <div 
      className={cn('grid gap-6', className)}
      role="status"
      aria-label={`Loading ${count} opportunities`}
    >
      {[...Array(count)].map((_, i) => (
        <OpportunityCardSkeleton 
          key={i} 
          isDarkTheme={isDarkTheme}
        />
      ))}
      <span className="sr-only">Loading opportunities...</span>
    </div>
  );
}

export default OpportunityCardSkeleton;
