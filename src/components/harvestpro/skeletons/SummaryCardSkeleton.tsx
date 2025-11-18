/**
 * SummaryCardSkeleton Component
 * Loading skeleton for HarvestSummaryCard
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SummaryCardSkeletonProps {
  className?: string;
}

export function SummaryCardSkeleton({ className }: SummaryCardSkeletonProps) {
  return (
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
}
