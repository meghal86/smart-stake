/**
 * ProgressiveDisclosureList Component
 * 
 * Implements progressive disclosure pattern for portfolio lists.
 * Shows top 5 items by default with "View all" expansion.
 * 
 * Reuses: ExpandableCard, EnhancedErrorBoundary
 * 
 * Validates: Requirements 10.1, 10.2
 * Property 23: Progressive Disclosure Consistency
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedErrorBoundary } from '@/components/ux/EnhancedErrorBoundary';

export interface ProgressiveDisclosureListProps<T> {
  /** Array of items to display */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Number of items to show initially (default: 5) */
  initialCount?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Loading skeleton component */
  loadingSkeleton?: React.ReactNode;
  /** Custom "View all" button text */
  viewAllText?: string;
  /** Custom "Show less" button text */
  showLessText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when expansion state changes */
  onExpansionChange?: (isExpanded: boolean) => void;
  /** Component name for error tracking */
  componentName?: string;
}

export function ProgressiveDisclosureList<T>({
  items,
  renderItem,
  initialCount = 5,
  isLoading = false,
  error = null,
  emptyState,
  loadingSkeleton,
  viewAllText = 'View all',
  showLessText = 'Show less',
  className,
  onExpansionChange,
  componentName = 'ProgressiveDisclosureList'
}: ProgressiveDisclosureListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpansionChange?.(newState);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)} role="status" aria-label="Loading">
        {loadingSkeleton || <DefaultLoadingSkeleton count={initialCount} />}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <EnhancedErrorBoundary
        component={componentName}
        enableRecovery={true}
      >
        <div className="text-center py-8">
          <p className="text-white/70">Failed to load items</p>
        </div>
      </EnhancedErrorBoundary>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        {emptyState || <DefaultEmptyState />}
      </div>
    );
  }

  const visibleItems = isExpanded ? items : items.slice(0, initialCount);
  const hasMore = items.length > initialCount;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Visible Items */}
      <AnimatePresence mode="popLayout">
        {visibleItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* View All / Show Less Button */}
      {hasMore && (
        <motion.div
          className="flex justify-center pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={handleToggle}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-sm font-medium',
              'text-cyan-400 hover:text-cyan-300',
              'bg-white/5 hover:bg-white/10',
              'backdrop-blur-sm border border-white/10 hover:border-white/20',
              'rounded-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900',
              'min-h-[44px]' // Touch target size
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? showLessText : `${viewAllText} (${items.length - initialCount} more)`}
          >
            <span>
              {isExpanded 
                ? showLessText 
                : `${viewAllText} (${items.length - initialCount} more)`
              }
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Default Loading Skeleton
 */
function DefaultLoadingSkeleton({ count = 5 }: { count: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 animate-pulse"
        >
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading items...</span>
    </>
  );
}

/**
 * Default Empty State
 */
function DefaultEmptyState() {
  return (
    <div className="text-white/70">
      <p className="text-sm">No items to display</p>
    </div>
  );
}
