/**
 * HarvestSummaryCard Component
 * Guardian-style summary card with 2x2 metrics grid
 * 
 * Requirements: Enhanced Req 3 AC4-5 (gas nonzero, fallback)
 * Design: Data Integrity → Gas Oracle Rules
 */

import { motion } from 'framer-motion';
import { TrendingDown, DollarSign, Coins, Zap, AlertTriangle, HelpCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpportunitiesSummary } from '@/types/harvestpro';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface HarvestSummaryCardProps {
  summary: OpportunitiesSummary;
  hasHighRiskOpportunities?: boolean;
  className?: string;
}

/**
 * Metric with Trust Signal Component
 * 
 * Displays a metric with "How it's calculated" tooltip
 */
interface MetricWithTrustSignalProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
  methodology: string[];
  delay: number;
}

// Gas Price Status Component for Summary Card
function GasPriceStatus() {
  const { data: networkStatus, isLoading, error, refetch } = useNetworkStatus();
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Zap className="w-3 h-3 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error || !networkStatus) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <Zap className="w-3 h-3 text-red-400" />
        <span className="text-red-400">Unavailable</span>
        <button
          onClick={() => refetch()}
          className="p-0.5 rounded hover:bg-red-500/20 transition-colors"
          title="Retry gas price fetch"
        >
          <RotateCcw className="w-2 h-2 text-red-400" />
        </button>
      </div>
    );
  }

  const { formattedGasPrice, gasColorClass } = networkStatus;
  
  if (formattedGasPrice === 'Gas unavailable') {
    return (
      <div className="flex items-center gap-1 text-xs">
        <Zap className="w-3 h-3 text-red-400" />
        <span className="text-red-400">Unavailable</span>
        <button
          onClick={() => refetch()}
          className="p-0.5 rounded hover:bg-red-500/20 transition-colors"
          title="Retry gas price fetch"
        >
          <RotateCcw className="w-2 h-2 text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      <Zap className="w-3 h-3 text-gray-400" />
      <span className={gasColorClass}>{formattedGasPrice}</span>
    </div>
  );
}

function MetricWithTrustSignal({
  icon: Icon,
  label,
  value,
  color,
  methodology,
  delay,
}: MetricWithTrustSignalProps) {
  const metricId = `metric-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const descriptionId = `${metricId}-description`;

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      role="group"
      aria-labelledby={metricId}
      aria-describedby={descriptionId}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('w-5 h-5', color)} aria-hidden="true" />
        <p 
          id={metricId}
          className="text-xs uppercase text-gray-500 tracking-wider font-medium"
        >
          {label}
        </p>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-gray-400 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
                aria-label={`How ${label.toLowerCase()} is calculated`}
                title={`How ${label.toLowerCase()} is calculated`}
              >
                <HelpCircle className="w-3 h-3" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-sm p-4 bg-slate-800 border-slate-600 text-slate-100"
              role="tooltip"
            >
              <div className="space-y-2">
                <div className="font-semibold text-cyan-400 mb-3">
                  {label} Calculation
                </div>
                <div className="space-y-1 text-xs">
                  {methodology.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-600 text-xs text-slate-400">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <p 
        id={descriptionId}
        className="text-3xl font-bold text-white"
        aria-label={`${label}: ${value}`}
      >
        {value}
      </p>
    </motion.div>
  );
}

export function HarvestSummaryCard({
  summary,
  hasHighRiskOpportunities = false,
  className,
}: HarvestSummaryCardProps) {
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

  // Methodology content for each metric
  const methodologies = {
    totalLoss: [
      'Sum of all unrealized losses across eligible lots',
      'Calculated using FIFO (First-In-First-Out) accounting method',
      'Only includes lots with losses exceeding $20 minimum threshold',
      'Updated in real-time with current market prices from CoinGecko',
      'Excludes lots that fail liquidity or Guardian score requirements'
    ],
    netBenefit: [
      'Tax savings minus all execution costs (gas + slippage + fees)',
      'Tax savings calculated using user\'s configured tax rate (default 24%)',
      'Gas costs estimated using current network conditions',
      'Slippage estimated based on DEX liquidity depth analysis',
      'Trading fees include both DEX protocol fees and potential MEV costs'
    ],
    eligibleTokens: [
      'Count of unique tokens with harvestable loss opportunities',
      'Tokens must pass Guardian security score threshold (≥3/10)',
      'Must have sufficient liquidity for execution without excessive slippage',
      'Excludes tokens with gas costs exceeding potential tax benefits',
      'Only counts tokens tradable on supported DEX protocols'
    ],
    gasEfficiency: [
      'Weighted average of gas cost efficiency across all opportunities',
      'Grade A: Gas costs <10% of tax benefit, Grade B: 10-25%, Grade C: >25%',
      'Calculated using current network gas prices and token-specific routing',
      'Accounts for multi-hop swaps and approval transactions where needed',
      'Updated every 30 seconds to reflect network congestion changes'
    ]
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
      role="region"
      aria-labelledby="harvest-summary-title"
      aria-describedby="harvest-summary-description"
    >
      {/* Screen reader title */}
      <h2 id="harvest-summary-title" className="sr-only">
        Harvest Opportunities Summary
      </h2>
      <p id="harvest-summary-description" className="sr-only">
        Overview of available tax-loss harvesting opportunities including total losses, net benefits, and efficiency metrics
      </p>

      {/* Warning Banner */}
      {hasHighRiskOpportunities && (
        <motion.div
          className="mb-4 p-3 rounded-lg bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-yellow-500">
            Some opportunities have elevated risk. Review Guardian scores carefully.
          </p>
        </motion.div>
      )}

      {/* 2x2 Metrics Grid */}
      <div className="grid grid-cols-2 gap-6" role="group" aria-label="Harvest opportunity metrics">
        {/* Total Harvestable Loss */}
        <MetricWithTrustSignal
          icon={TrendingDown}
          label="Total Loss"
          value={formatCurrency(summary.totalHarvestableLoss)}
          color="text-red-400"
          methodology={methodologies.totalLoss}
          delay={0.25}
        />

        {/* Estimated Net Benefit */}
        <MetricWithTrustSignal
          icon={DollarSign}
          label="Net Benefit"
          value={formatCurrency(summary.estimatedNetBenefit)}
          color="text-green-400"
          methodology={methodologies.netBenefit}
          delay={0.3}
        />

        {/* Eligible Tokens Count */}
        <MetricWithTrustSignal
          icon={Coins}
          label="Eligible Tokens"
          value={summary.eligibleTokensCount.toString()}
          color="text-blue-400"
          methodology={methodologies.eligibleTokens}
          delay={0.35}
        />

        {/* Gas Efficiency Score */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <Zap className={cn('w-5 h-5', getGasEfficiencyColor(summary.gasEfficiencyScore))} aria-hidden="true" />
            <p className="text-xs uppercase text-gray-500 tracking-wider font-medium">
              Gas Efficiency
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="text-gray-400 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded"
                    aria-label="How gas efficiency is calculated"
                    title="How gas efficiency is calculated"
                  >
                    <HelpCircle className="w-3 h-3" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-sm p-4 bg-slate-800 border-slate-600 text-slate-100"
                  role="tooltip"
                >
                  <div className="space-y-2">
                    <div className="font-semibold text-cyan-400 mb-3">
                      Gas Efficiency Calculation
                    </div>
                    <div className="space-y-1 text-xs">
                      {methodologies.gasEfficiency.map((line, index) => (
                        <div key={index}>{line}</div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-600 text-xs text-slate-400">
                      Last updated: {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center justify-between">
            <p 
              className={cn('text-2xl font-bold', getGasEfficiencyColor(summary.gasEfficiencyScore))}
              aria-label={`Gas efficiency grade: ${summary.gasEfficiencyScore}`}
            >
              {summary.gasEfficiencyScore}
            </p>
            <GasPriceStatus />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
