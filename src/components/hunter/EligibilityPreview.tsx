/**
 * Eligibility Preview Component
 * 
 * Shows eligibility status and reasons for wallet-connected users.
 * 
 * Requirements:
 * - 6.1-6.8: Eligibility preview
 * - 5.6: Display eligibility with reasons
 */

import React from 'react';
import { CheckCircle, AlertCircle, HelpCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EligibilityStatus } from '@/types/hunter';

interface EligibilityPreviewProps {
  status: EligibilityStatus;
  reasons: string[];
  className?: string;
}

export function EligibilityPreview({
  status,
  reasons,
  className,
}: EligibilityPreviewProps) {
  // Status styling
  const statusConfig = {
    likely: {
      icon: CheckCircle,
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-400',
      label: 'Likely Eligible',
    },
    maybe: {
      icon: AlertCircle,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      label: 'Maybe Eligible',
    },
    unlikely: {
      icon: XCircle,
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      label: 'Unlikely Eligible',
    },
    unknown: {
      icon: HelpCircle,
      bg: 'bg-slate-50 dark:bg-slate-800/50',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-700 dark:text-slate-400',
      label: 'Unknown',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        config.bg,
        config.border,
        className
      )}
      role="status"
      aria-label={`Eligibility: ${config.label}`}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.text)} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className={cn('text-sm font-semibold mb-1', config.text)}>
            {config.label}
          </div>
          {reasons.length > 0 && (
            <ul className="space-y-1">
              {reasons.slice(0, 2).map((reason, idx) => (
                <li
                  key={idx}
                  className={cn(
                    'text-xs flex items-start gap-1',
                    config.text,
                    'opacity-90'
                  )}
                >
                  <span className="mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
