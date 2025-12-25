/**
 * HarvestSummaryCard Component
 * Guardian-style summary card with 2x2 metrics grid
 */

import { motion } from 'framer-motion';
import { TrendingDown, DollarSign, Coins, Zap, AlertTriangle, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemoMode } from '@/lib/ux/DemoModeManager';
import type { OpportunitiesSummary } from '@/types/harvestpro';

interface HarvestSummaryCardProps {
  summary: OpportunitiesSummary;
  hasHighRiskOpportunities?: boolean;
  className?: string;
}

export function HarvestSummaryCard({
  summary,
  hasHighRiskOpportunities = false,
  className,
}: HarvestSummaryCardProps) {
  const { isDemo } = useDemoMode();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getGasEfficiencyColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-500';
      case 'B':
        return 'text-yellow-500';
      case 'C':
        return 'text-orange-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      className={cn(
        'rounded-2xl border-2 p-7',
        'bg-gradient-to-br from-[rgba(20,184,166,0.12)] via-[rgba(139,92,246,0.08)] to-[rgba(6,182,212,0.06)]',
        'border-[rgba(20,184,166,0.25)]',
        'backdrop-blur-md',
        className
      )}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
    >
      {/* Demo Mode Badge */}
      {isDemo && (
        <motion.div
          className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TestTube className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">Demo Data</span>
        </motion.div>
      )}
      
      {/* Warning Banner */}
      {hasHighRiskOpportunities && (
        <motion.div
          className="mb-4 p-3 rounded-lg bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-500">
            Some opportunities have elevated risk. Review Guardian scores carefully.
          </p>
        </motion.div>
      )}

      {/* 2x2 Metrics Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Total Harvestable Loss */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <p className="text-xs uppercase text-gray-500 tracking-wider font-medium">
              Total Loss
            </p>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(summary.totalHarvestableLoss)}
          </p>
        </motion.div>

        {/* Estimated Net Benefit */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <p className="text-xs uppercase text-gray-500 tracking-wider font-medium">
              Net Benefit
            </p>
          </div>
          <p className="text-3xl font-bold text-green-400">
            {formatCurrency(summary.estimatedNetBenefit)}
          </p>
        </motion.div>

        {/* Eligible Tokens Count */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-400" />
            <p className="text-xs uppercase text-gray-500 tracking-wider font-medium">
              Eligible Tokens
            </p>
          </div>
          <p className="text-3xl font-bold text-white">
            {summary.eligibleTokensCount}
          </p>
        </motion.div>

        {/* Gas Efficiency Score */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <p className="text-xs uppercase text-gray-500 tracking-wider font-medium">
              Gas Efficiency
            </p>
          </div>
          <p className={cn('text-3xl font-bold', getGasEfficiencyColor(summary.gasEfficiencyScore))}>
            {summary.gasEfficiencyScore}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
