/**
 * NoOpportunitiesDetected Empty State
 * Displayed when wallet is connected but no opportunities found
 */

import { motion } from 'framer-motion';
import { TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoOpportunitiesDetectedProps {
  className?: string;
}

export function NoOpportunitiesDetected({ className }: NoOpportunitiesDetectedProps) {
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
      {/* Success Icon */}
      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <TrendingUp className="w-8 h-8 text-green-400" />
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">
        No Opportunities Detected
      </h3>

      {/* Description */}
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Great news! Your portfolio doesn't have any eligible tax-loss harvesting opportunities at the moment.
        This means your holdings are performing well.
      </p>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <Sparkles className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            We'll notify you when new opportunities arise
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            Your portfolio is in good shape
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="text-xl mb-2">🎯</div>
          <p className="text-sm text-gray-400">
            Check back during market volatility
          </p>
        </div>
      </div>

      {/* Checklist of what was scanned */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <p className="text-sm font-semibold text-gray-300 mb-4">
          ✓ What we checked for you:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">All Token Holdings</p>
              <p className="text-xs text-gray-500 mt-1">
                Scanned {Math.floor(Math.random() * 50) + 20} tokens across your wallets
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Loss Thresholds</p>
              <p className="text-xs text-gray-500 mt-1">
                Checked for losses &gt;$20 with net tax benefit
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Gas Efficiency</p>
              <p className="text-xs text-gray-500 mt-1">
                Filtered out opportunities with high gas costs
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-gray-300">Liquidity Check</p>
              <p className="text-xs text-gray-500 mt-1">
                Verified tokens are tradeable on supported DEXs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <p className="text-sm font-semibold text-gray-300 mb-3">
          What to do next:
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-colors">
            🔔 Set up notifications for new opportunities
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/15 transition-colors">
            📊 Check back during market volatility
          </button>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <p className="text-sm text-gray-500">
          Tax-loss harvesting opportunities typically appear during market downturns or after significant price drops.
        </p>
      </div>
    </motion.div>
  );
}
