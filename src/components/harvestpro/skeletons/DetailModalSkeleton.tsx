/**
 * DetailModalSkeleton Component
 * Loading skeleton for HarvestDetailModal
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DetailModalSkeletonProps {
  onClose: () => void;
  className?: string;
}

export function DetailModalSkeleton({ onClose, className }: DetailModalSkeletonProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={cn(
          'w-full max-w-2xl rounded-2xl border p-8',
          'bg-gradient-to-br from-[rgba(255,255,255,0.08)] to-[rgba(0,0,0,0.6)]',
          'border-[rgba(255,255,255,0.12)]',
          'backdrop-blur-xl',
          'animate-pulse',
          className
        )}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-7 w-48 bg-gray-700 rounded" />
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Summary Section */}
        <div className="space-y-4 mb-6">
          <div className="h-6 w-32 bg-gray-700 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-20 bg-gray-700 rounded" />
                <div className="h-6 w-24 bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Steps Section */}
        <div className="space-y-3 mb-6">
          <div className="h-6 w-40 bg-gray-700 rounded" />
          {[...Array(3)].map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <div className="w-6 h-6 bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full bg-gray-700 rounded" />
                <div className="h-3 w-3/4 bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Cost Table */}
        <div className="space-y-3 mb-6">
          <div className="h-6 w-32 bg-gray-700 rounded" />
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex justify-between">
              <div className="h-4 w-24 bg-gray-700 rounded" />
              <div className="h-4 w-20 bg-gray-700 rounded" />
            </div>
          ))}
        </div>

        {/* Prepare Button */}
        <div className="h-12 w-full bg-gray-700 rounded-xl" />
      </motion.div>
    </motion.div>
  );
}
