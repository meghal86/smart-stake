/**
 * EligibilityPreview Component
 * 
 * Displays eligibility status for an opportunity with:
 * - Active wallet integration
 * - Automatic refresh on wallet change
 * - Manual recalculation button with throttling
 * - Loading states
 * - Color-coded status indicators
 * 
 * Requirements: 5.6, 6.1-6.8, 17.5, 18.5
 * Task: 47
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, XCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { useEligibilityCheck } from '@/hooks/useEligibilityCheck';
import { cn } from '@/lib/utils';

interface EligibilityPreviewProps {
  opportunityId: string;
  chain: string;
  className?: string;
  isDarkTheme?: boolean;
}

/**
 * Status icon mapping
 */
const statusIcons = {
  likely: CheckCircle,
  maybe: AlertCircle,
  unlikely: XCircle,
  unknown: HelpCircle,
};

/**
 * Status color mapping (dark theme)
 */
const statusColorsDark = {
  likely: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  maybe: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  unlikely: 'text-red-400 bg-red-400/10 border-red-400/20',
  unknown: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

/**
 * Status color mapping (light theme)
 */
const statusColorsLight = {
  likely: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  maybe: 'text-amber-600 bg-amber-50 border-amber-200',
  unlikely: 'text-red-600 bg-red-50 border-red-200',
  unknown: 'text-gray-600 bg-gray-50 border-gray-200',
};

/**
 * Status label mapping
 */
const statusLabels = {
  likely: 'Likely Eligible',
  maybe: 'Maybe Eligible',
  unlikely: 'Unlikely Eligible',
  unknown: 'Unknown',
};

/**
 * EligibilityPreview Component
 * 
 * Displays eligibility status with reasons and recalculate button.
 * Automatically updates when active wallet changes.
 */
export function EligibilityPreview({
  opportunityId,
  chain,
  className,
  isDarkTheme = true,
}: EligibilityPreviewProps) {
  const {
    eligibility,
    isLoading,
    isRecalculating,
    error,
    recalculate,
    hasWallet,
  } = useEligibilityCheck({
    opportunityId,
    chain,
    enabled: true,
  });

  // Don't render if no wallet is connected
  if (!hasWallet) {
    return null;
  }

  // Loading state
  if (isLoading && !eligibility) {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <div className={cn(
          'w-4 h-4 rounded-full border-2 border-t-transparent animate-spin',
          isDarkTheme ? 'border-gray-400' : 'border-gray-600'
        )} />
        <span className={isDarkTheme ? 'text-gray-400' : 'text-gray-600'}>
          Checking eligibility...
        </span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn(
        'flex items-center gap-2 text-sm p-2 rounded-lg border',
        isDarkTheme
          ? 'text-red-400 bg-red-400/10 border-red-400/20'
          : 'text-red-600 bg-red-50 border-red-200',
        className
      )}>
        <XCircle className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">Failed to check eligibility</span>
      </div>
    );
  }

  // No data state
  if (!eligibility) {
    return null;
  }

  const status = eligibility.status;
  const StatusIcon = statusIcons[status];
  const statusColors = isDarkTheme ? statusColorsDark[status] : statusColorsLight[status];
  const statusLabel = statusLabels[status];

  return (
    <motion.div
      className={cn(
        'flex flex-col gap-2 p-3 rounded-lg border',
        statusColors,
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Status Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusIcon className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold text-sm">
            {statusLabel}
          </span>
          {eligibility.score > 0 && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              isDarkTheme ? 'bg-black/20' : 'bg-white/50'
            )}>
              {Math.round(eligibility.score * 100)}%
            </span>
          )}
        </div>

        {/* Recalculate Button */}
        <button
          onClick={recalculate}
          disabled={isRecalculating}
          className={cn(
            'p-1 rounded transition-all',
            isDarkTheme
              ? 'hover:bg-white/10 active:bg-white/20'
              : 'hover:bg-black/5 active:bg-black/10',
            isRecalculating && 'opacity-50 cursor-not-allowed'
          )}
          title="Recalculate eligibility (throttled to 1 per 5s)"
          aria-label="Recalculate eligibility"
        >
          <RefreshCw
            className={cn(
              'w-3.5 h-3.5',
              isRecalculating && 'animate-spin'
            )}
          />
        </button>
      </div>

      {/* Reasons */}
      {eligibility.reasons && eligibility.reasons.length > 0 && (
        <ul className="text-xs space-y-1 pl-6">
          {eligibility.reasons.slice(0, 2).map((reason, index) => (
            <li key={index} className="list-disc">
              {reason}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
