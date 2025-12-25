/**
 * EnhancedLoadingSkeleton Component
 * Enhanced loading skeleton with descriptive messages and timeout handling
 * 
 * Requirements: Enhanced Req 14 AC1-3 (error banners) + Enhanced Req 17 AC1-2 (performance)
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LoadingIndicator } from '@/components/ux/LoadingSystem';
import { TimeoutHandler } from '@/components/ux/TimeoutHandler';
import { useLoadingState } from '@/hooks/useLoadingState';

interface EnhancedLoadingSkeletonProps {
  /**
   * Loading context ID to track
   */
  contextId: string;
  
  /**
   * Operation type for contextual messaging
   */
  operationType: 'navigation' | 'async-action' | 'data-fetch' | 'wallet-connect' | 'form-submit';
  
  /**
   * Custom loading message
   */
  message?: string;
  
  /**
   * Skeleton variant
   */
  variant?: 'summary-card' | 'opportunity-cards' | 'detail-modal' | 'execution-flow';
  
  /**
   * Number of skeleton items (for cards)
   */
  count?: number;
  
  /**
   * Retry callback for timeout scenarios
   */
  onRetry?: () => void;
  
  /**
   * Cancel callback for timeout scenarios
   */
  onCancel?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Summary card skeleton
 */
const SummaryCardSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'rounded-2xl border-2 p-6',
      'bg-gradient-to-br from-[rgba(20,184,166,0.1)] to-[rgba(6,182,212,0.05)]',
      'border-[rgba(20,184,166,0.2)]',
      'backdrop-blur-md',
      'animate-pulse',
      className
    )}
  >
    {/* 2x2 Metrics Grid */}
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="space-y-2">
          {/* Icon + Label */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 rounded" />
            <div className="h-3 w-20 bg-gray-700 rounded" />
          </div>
          {/* Value */}
          <div className="h-8 w-24 bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Opportunity card skeleton
 */
const OpportunityCardSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'rounded-2xl border p-6',
      'bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)]',
      'border-[rgba(255,255,255,0.08)]',
      'backdrop-blur-md',
      'animate-pulse',
      className
    )}
  >
    {/* Header Row */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        {/* Token Logo */}
        <div className="w-12 h-12 bg-gray-700 rounded-full" />
        <div className="space-y-2">
          {/* Title */}
          <div className="h-5 w-32 bg-gray-700 rounded" />
          {/* Subtitle */}
          <div className="h-4 w-24 bg-gray-700 rounded" />
        </div>
      </div>
      {/* Category Tag + Risk Chip */}
      <div className="flex items-center gap-2">
        <div className="h-6 w-16 bg-gray-700 rounded-full" />
        <div className="h-6 w-12 bg-gray-700 rounded-full" />
      </div>
    </div>

    {/* Metric Strip */}
    <div className="grid grid-cols-4 gap-4 mb-4">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="space-y-1">
          <div className="h-3 w-16 bg-gray-700 rounded" />
          <div className="h-5 w-20 bg-gray-700 rounded" />
        </div>
      ))}
    </div>

    {/* CTA Button */}
    <div className="h-10 w-full bg-gray-700 rounded-xl" />
  </div>
);

/**
 * Detail modal skeleton
 */
const DetailModalSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('space-y-6 p-6', className)}>
    {/* Header */}
    <div className="space-y-2">
      <div className="h-8 w-48 bg-gray-700 rounded animate-pulse" />
      <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
    </div>
    
    {/* Summary Section */}
    <div className="grid grid-cols-3 gap-4">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
          <div className="h-6 w-24 bg-gray-700 rounded animate-pulse" />
        </div>
      ))}
    </div>
    
    {/* Steps */}
    <div className="space-y-3">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
          <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
            <div className="h-3 w-48 bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
    
    {/* Buttons */}
    <div className="flex gap-3">
      <div className="h-10 flex-1 bg-gray-700 rounded animate-pulse" />
      <div className="h-10 flex-1 bg-gray-700 rounded animate-pulse" />
    </div>
  </div>
);

/**
 * Execution flow skeleton
 */
const ExecutionFlowSkeleton = ({ className }: { className?: string }) => (
  <div className={cn('space-y-4 p-6', className)}>
    {/* Progress indicator */}
    <div className="h-2 w-full bg-gray-700 rounded animate-pulse" />
    
    {/* Current step */}
    <div className="space-y-3">
      <div className="h-6 w-40 bg-gray-700 rounded animate-pulse" />
      <div className="h-4 w-64 bg-gray-700 rounded animate-pulse" />
    </div>
    
    {/* Action button */}
    <div className="h-12 w-full bg-gray-700 rounded animate-pulse" />
  </div>
);

export function EnhancedLoadingSkeleton({
  contextId,
  operationType,
  message,
  variant = 'opportunity-cards',
  count = 3,
  onRetry,
  onCancel,
  className
}: EnhancedLoadingSkeletonProps) {
  const { getLoadingState } = useLoadingState();
  const loadingState = getLoadingState(contextId);
  
  // Handle timeout state
  if (loadingState?.hasTimedOut) {
    return (
      <TimeoutHandler
        isTimedOut={true}
        operationType={operationType}
        onRetry={onRetry}
        onCancel={onCancel}
        variant="inline"
        className={className}
      />
    );
  }
  
  // Show loading skeleton with descriptive message
  const loadingMessage = message || loadingState?.message || 'Loading...';
  
  const renderSkeleton = () => {
    switch (variant) {
      case 'summary-card':
        return <SummaryCardSkeleton />;
        
      case 'opportunity-cards':
        return (
          <div className="space-y-4">
            {[...Array(count)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <OpportunityCardSkeleton />
              </motion.div>
            ))}
          </div>
        );
        
      case 'detail-modal':
        return <DetailModalSkeleton />;
        
      case 'execution-flow':
        return <ExecutionFlowSkeleton />;
        
      default:
        return <OpportunityCardSkeleton />;
    }
  };
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Skeleton content */}
      {renderSkeleton()}
      
      {/* Loading indicator with descriptive message */}
      <div className="flex justify-center">
        <LoadingIndicator
          message={loadingMessage}
          size="md"
          variant="spinner"
        />
      </div>
    </div>
  );
}