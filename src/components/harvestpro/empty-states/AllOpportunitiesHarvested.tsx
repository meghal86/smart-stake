/**
 * AllOpportunitiesHarvested Empty State
 * Displayed when all opportunities have been harvested
 */

import { motion } from 'framer-motion';
import { CheckCircle2, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AllOpportunitiesHarvestedProps {
  onDownloadCSV?: () => void;
  onViewProof?: () => void;
  className?: string;
}

export function AllOpportunitiesHarvested({
  onDownloadCSV,
  onViewProof,
  className,
}: AllOpportunitiesHarvestedProps) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border-2 p-8 text-center',
        'bg-gradient-to-br from-[rgba(16,185,129,0.1)] to-[rgba(16,185,129,0.05)]',
        'border-[rgba(16,185,129,0.3)]',
        'backdrop-blur-md',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Success Icon with Confetti Effect */}
      <motion.div
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/20 mb-4 relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <CheckCircle2 className="w-10 h-10 text-green-400" />
        
        {/* Confetti particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 2 === 0 ? '#10b981' : '#14b8a6',
              left: '50%',
              top: '50%',
            }}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              x: Math.cos((i * Math.PI * 2) / 8) * 40,
              y: Math.sin((i * Math.PI * 2) / 8) * 40,
            }}
            transition={{
              duration: 0.8,
              delay: 0.2 + i * 0.05,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-2">
        All Opportunities Harvested! 🎉
      </h3>

      {/* Description */}
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Congratulations! You've successfully harvested all available tax-loss opportunities.
        Your tax savings are ready for export.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        {onDownloadCSV && (
          <motion.button
            onClick={onDownloadCSV}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#ed8f2d] to-[#B8722E] text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-5 h-5" />
            Download Form 8949 CSV
          </motion.button>
        )}

        {onViewProof && (
          <motion.button
            onClick={onViewProof}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="w-5 h-5" />
            View Proof-of-Harvest
          </motion.button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-6 border-t border-green-500/20">
        <div>
          <p className="text-2xl font-bold text-green-400">✓</p>
          <p className="text-xs text-gray-400 mt-1">Completed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-white">$0</p>
          <p className="text-xs text-gray-400 mt-1">Remaining</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-400">100%</p>
          <p className="text-xs text-gray-400 mt-1">Harvested</p>
        </div>
      </div>
    </motion.div>
  );
}
