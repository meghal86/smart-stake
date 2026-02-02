/**
 * Portfolio Skeleton Loading Components
 * 
 * Reusable skeleton loaders for portfolio sections.
 * Extends OpportunityCardSkeleton pattern for portfolio use cases.
 * 
 * Validates: Requirements 10.2
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  isDarkTheme?: boolean;
}

/**
 * Action Card Skeleton
 * For recommended actions feed
 */
export function ActionCardSkeleton({ className, isDarkTheme = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-lg rounded-lg p-6 animate-pulse',
        isDarkTheme ? 'bg-white/5 border border-white/10' : 'bg-white/90 shadow-sm',
        className
      )}
      role="status"
      aria-label="Loading action"
    >
      {/* Severity Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          'h-6 rounded-full w-20',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
        <div className={cn(
          'h-8 rounded w-16',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
      </div>

      {/* Title */}
      <div className={cn(
        'h-6 rounded w-3/4 mb-3',
        isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
      )} />

      {/* Why bullets */}
      <div className="space-y-2 mb-4">
        <div className={cn(
          'h-4 rounded w-full',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
        <div className={cn(
          'h-4 rounded w-5/6',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
      </div>

      {/* Impact Preview */}
      <div className="flex gap-4 mb-4">
        <div className={cn(
          'h-10 rounded flex-1',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
        <div className={cn(
          'h-10 rounded flex-1',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
      </div>

      {/* CTA Button */}
      <div className={cn(
        'h-10 rounded-lg w-full',
        isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
      )} />

      <span className="sr-only">Loading action card</span>
    </div>
  );
}

/**
 * Approval Risk Card Skeleton
 * For approvals list
 */
export function ApprovalRiskCardSkeleton({ className, isDarkTheme = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-lg rounded-lg p-6 animate-pulse',
        isDarkTheme ? 'bg-white/5 border border-white/10' : 'bg-white/90 shadow-sm',
        className
      )}
      role="status"
      aria-label="Loading approval"
    >
      {/* Header with severity */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'h-10 w-10 rounded-full',
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
          )} />
          <div className="space-y-2">
            <div className={cn(
              'h-5 rounded w-32',
              isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
            )} />
            <div className={cn(
              'h-4 rounded w-24',
              isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
            )} />
          </div>
        </div>
        <div className={cn(
          'h-8 rounded-full w-20',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
      </div>

      {/* Risk details */}
      <div className="space-y-2 mb-4">
        <div className={cn(
          'h-4 rounded w-full',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
        <div className={cn(
          'h-4 rounded w-4/5',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <div className={cn(
          'h-9 rounded flex-1',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
        <div className={cn(
          'h-9 rounded flex-1',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
      </div>

      <span className="sr-only">Loading approval risk card</span>
    </div>
  );
}

/**
 * Position Card Skeleton
 * For positions tab
 */
export function PositionCardSkeleton({ className, isDarkTheme = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-lg rounded-lg p-6 animate-pulse',
        isDarkTheme ? 'bg-white/5 border border-white/10' : 'bg-white/90 shadow-sm',
        className
      )}
      role="status"
      aria-label="Loading position"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className={cn(
            'h-12 w-12 rounded-full',
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
          )} />
          <div className="space-y-2 flex-1">
            <div className={cn(
              'h-5 rounded w-32',
              isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
            )} />
            <div className={cn(
              'h-4 rounded w-24',
              isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
            )} />
          </div>
        </div>
        <div className="text-right space-y-2">
          <div className={cn(
            'h-6 rounded w-24 ml-auto',
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
          )} />
          <div className={cn(
            'h-4 rounded w-16 ml-auto',
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
          )} />
        </div>
      </div>

      <span className="sr-only">Loading position card</span>
    </div>
  );
}

/**
 * Transaction Timeline Item Skeleton
 * For audit tab
 */
export function TransactionTimelineItemSkeleton({ className, isDarkTheme = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'flex gap-4 animate-pulse',
        className
      )}
      role="status"
      aria-label="Loading transaction"
    >
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'h-3 w-3 rounded-full',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
        <div className={cn(
          'w-px h-full mt-2',
          isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="space-y-2">
          <div className={cn(
            'h-5 rounded w-48',
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
          )} />
          <div className={cn(
            'h-4 rounded w-32',
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
          )} />
          <div className={cn(
            'h-4 rounded w-full',
            isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'
          )} />
        </div>
      </div>

      <span className="sr-only">Loading transaction</span>
    </div>
  );
}

/**
 * Grid of Skeletons
 * Generic grid wrapper for any skeleton type
 */
interface SkeletonGridProps {
  count?: number;
  SkeletonComponent: React.ComponentType<SkeletonProps>;
  isDarkTheme?: boolean;
  className?: string;
}

export function SkeletonGrid({ 
  count = 5, 
  SkeletonComponent,
  isDarkTheme = true,
  className 
}: SkeletonGridProps) {
  return (
    <div className={cn('space-y-4', className)} role="status" aria-label={`Loading ${count} items`}>
      {[...Array(count)].map((_, i) => (
        <SkeletonComponent key={i} isDarkTheme={isDarkTheme} />
      ))}
      <span className="sr-only">Loading items...</span>
    </div>
  );
}
