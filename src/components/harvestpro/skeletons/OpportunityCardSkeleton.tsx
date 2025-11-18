/**
 * OpportunityCardSkeleton Component
 * Loading skeleton for HarvestOpportunityCard (Hunter-style)
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OpportunityCardSkeletonProps {
  className?: string;
}

export function OpportunityCardSkeleton({ className }: OpportunityCardSkeletonProps) {
  return (
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
}

interface OpportunityCardSkeletonGridProps {
  count?: number;
  className?: string;
}

export function OpportunityCardSkeletonGrid({
  count = 3,
  className,
}: OpportunityCardSkeletonGridProps) {
  return (
    <div className={cn('space-y-4', className)}>
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
}
