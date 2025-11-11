/**
 * Reward Display Component
 * 
 * Displays reward information with min-max range and confidence level.
 * 
 * Requirements:
 * - 5.3-5.5: Reward display with confidence
 * - 5.11-5.12: APR/APY normalization and formatting
 * - 5.17: Intl.NumberFormat for amounts
 */

import React from 'react';
import { TrendingUp, DollarSign, Coins, Award, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RewardUnit, RewardConfidence } from '@/types/hunter';

interface RewardDisplayProps {
  min: number;
  max: number;
  currency: RewardUnit;
  confidence: RewardConfidence;
  apr?: number;
  className?: string;
}

export function RewardDisplay({
  min,
  max,
  currency,
  confidence,
  apr,
  className,
}: RewardDisplayProps) {
  // Format numbers with Intl.NumberFormat
  const formatAmount = (amount: number, unit: RewardUnit) => {
    if (unit === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: amount >= 10000 ? 'compact' : 'standard',
        maximumFractionDigits: amount >= 10000 ? 1 : 0,
      }).format(amount);
    }

    if (unit === 'APR' || unit === 'APY') {
      return `${amount.toFixed(1)}%`;
    }

    if (unit === 'POINTS') {
      return new Intl.NumberFormat('en-US', {
        notation: amount >= 10000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
      }).format(amount);
    }

    // TOKEN or NFT
    return new Intl.NumberFormat('en-US', {
      notation: amount >= 10000 ? 'compact' : 'standard',
      maximumFractionDigits: amount >= 1000 ? 1 : 2,
    }).format(amount);
  };

  // Get icon based on currency type
  const getIcon = () => {
    switch (currency) {
      case 'USD':
        return DollarSign;
      case 'APR':
      case 'APY':
        return TrendingUp;
      case 'POINTS':
        return Sparkles;
      case 'NFT':
        return Award;
      case 'TOKEN':
      default:
        return Coins;
    }
  };

  const Icon = getIcon();

  // Display label for currency
  const getCurrencyLabel = () => {
    if (currency === 'APR' || currency === 'APY') {
      return 'APY'; // Normalized to APY per requirement 5.11
    }
    if (currency === 'POINTS') {
      return 'Points';
    }
    if (currency === 'NFT') {
      return 'NFT';
    }
    if (currency === 'TOKEN') {
      return 'Tokens';
    }
    return '';
  };

  const isRange = min !== max;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            'w-5 h-5',
            currency === 'USD' || currency === 'APY' || currency === 'APR'
              ? 'text-emerald-500'
              : 'text-blue-500'
          )}
          aria-hidden="true"
        />
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isRange ? (
              <>
                {formatAmount(min, currency)}
                <span className="text-sm font-normal text-slate-500 dark:text-slate-400 mx-1">
                  -
                </span>
                {formatAmount(max, currency)}
              </>
            ) : (
              formatAmount(max, currency)
            )}
          </span>
          {getCurrencyLabel() && (
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {getCurrencyLabel()}
            </span>
          )}
        </div>
      </div>

      {/* Confidence badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
            confidence === 'confirmed'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
          )}
        >
          {confidence === 'confirmed' ? '✓ Confirmed' : '~ Estimated'}
        </span>

        {/* APY display if provided and not already shown */}
        {apr && currency !== 'APR' && currency !== 'APY' && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {apr.toFixed(1)}% APY
          </span>
        )}
      </div>
    </div>
  );
}
