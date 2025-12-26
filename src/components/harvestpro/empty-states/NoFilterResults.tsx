/**
 * NoFilterResults Empty State
 * Displayed when filters are applied but no opportunities match
 */

import { motion } from 'framer-motion';
import { Filter, RotateCcw, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoFilterResultsProps {
  activeFilters: string[];
  onClearFilters?: () => void;
  onAdjustFilters?: () => void;
  totalOpportunities?: number;
  className?: string;
}

export function NoFilterResults({
  activeFilters,
  onClearFilters,
  onAdjustFilters,
  totalOpportunities = 0,
  className,
}: NoFilterResultsProps) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border p-8 text-center',
        'bg-gradient-to-br from-[rgba(255,255,255,0.06)] to-[rgba(255,255,255,0.02)]',
        'border-[rgba(255,255,255,0.08)]',
        'backdrop-blur-md',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Filter Icon */}
      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <Filter className="w-8 h-8 text-blue-400" />
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">
        No Results for Current Filters
      </h3>

      {/* Description */}
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        {totalOpportunities > 0 
          ? `Found ${totalOpportunities} total opportunities, but none match your current filters.`
          : 'Try adjusting your filters to see more opportunities.'
        }
      </p>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-3">Active filters:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm"
              >
                {filter}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        {onClearFilters && (
          <motion.button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ed8f2d] to-[#B8722E] text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCcw className="w-5 h-5" />
            Clear All Filters
          </motion.button>
        )}

        {onAdjustFilters && (
          <motion.button
            onClick={onAdjustFilters}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Filter className="w-5 h-5" />
            Adjust Filters
          </motion.button>
        )}
      </div>

      {/* Suggestions */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <p className="text-sm font-semibold text-gray-300 mb-4">
          Try these suggestions:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <TrendingDown className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-300">Lower Risk Filter</p>
              <p className="text-xs text-gray-500 mt-1">
                Include medium and high-risk opportunities
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="text-sm font-bold text-blue-400 flex-shrink-0 mt-0.5">$</div>
            <div>
              <p className="text-sm font-medium text-gray-300">Reduce Min Benefit</p>
              <p className="text-xs text-gray-500 mt-1">
                Lower the minimum net benefit threshold
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="text-sm font-bold text-blue-400 flex-shrink-0 mt-0.5">⏱</div>
            <div>
              <p className="text-sm font-medium text-gray-300">Include All Terms</p>
              <p className="text-xs text-gray-500 mt-1">
                Show both short-term and long-term losses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What was checked */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <p className="text-sm text-gray-500">
          We checked all your holdings and applied your filter criteria. 
          {totalOpportunities > 0 && ` ${totalOpportunities} opportunities are available with different filters.`}
        </p>
      </div>
    </motion.div>
  );
}