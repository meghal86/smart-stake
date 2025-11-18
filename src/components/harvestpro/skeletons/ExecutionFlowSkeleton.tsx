/**
 * ExecutionFlowSkeleton Component
 * Loading skeleton for ExecutionFlow UI
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ExecutionFlowSkeletonProps {
  className?: string;
}

export function ExecutionFlowSkeleton({ className }: ExecutionFlowSkeletonProps) {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-40 bg-gray-700 rounded" />
        <div className="h-8 w-24 bg-gray-700 rounded-full" />
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#ed8f2d] to-[#B8722E]"
            initial={{ width: '0%' }}
            animate={{ width: '60%' }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </div>

      {/* Execution Steps */}
      <div className="space-y-4">
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 rounded-lg bg-white/5"
          >
            {/* Step Number */}
            <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0" />

            {/* Step Content */}
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-gray-700 rounded" />
              <div className="h-4 w-1/2 bg-gray-700 rounded" />
              
              {/* Guardian Score */}
              <div className="flex items-center gap-2 mt-2">
                <div className="h-4 w-4 bg-gray-700 rounded" />
                <div className="h-4 w-16 bg-gray-700 rounded" />
              </div>
            </div>

            {/* Status Icon */}
            <div className="w-6 h-6 bg-gray-700 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <div className="h-10 flex-1 bg-gray-700 rounded-xl" />
        <div className="h-10 w-24 bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}
