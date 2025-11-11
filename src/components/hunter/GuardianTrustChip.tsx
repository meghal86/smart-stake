/**
 * Guardian Trust Chip Component
 * 
 * Displays trust score with color-coded chip and tooltip.
 * 
 * Requirements:
 * - 2.1-2.8: Trust & Security Display
 * - 9.4: Text labels (not color-only)
 * - 9.1: AA contrast standards
 */

import React from 'react';
import { Shield, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { TrustLevel } from '@/types/hunter';

interface GuardianTrustChipProps {
  score: number;
  level: TrustLevel;
  lastScannedTs: string;
  issues?: string[];
  onClick?: () => void;
  className?: string;
}

export function GuardianTrustChip({
  score,
  level,
  lastScannedTs,
  issues = [],
  onClick,
  className,
}: GuardianTrustChipProps) {
  // Color-coded styling based on trust level
  const levelStyles = {
    green: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: Shield,
      label: 'High Trust',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-400',
      icon: AlertTriangle,
      label: 'Medium Trust',
    },
    red: {
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-700 dark:text-red-400',
      icon: AlertTriangle,
      label: 'Low Trust',
    },
  };

  const style = levelStyles[level];
  const Icon = style.icon;

  // Format timestamp
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const scanned = new Date(timestamp);
    const diffMs = now.getTime() - scanned.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const topIssues = issues.slice(0, 3);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all',
              style.bg,
              style.border,
              style.text,
              onClick && 'hover:opacity-80 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500',
              className
            )}
            role="button"
            aria-expanded={false}
            aria-label={`Guardian trust score: ${score} out of 100, ${style.label}. Click for details.`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-semibold">
              {score}
            </span>
            <span className="text-xs font-medium">
              {style.label}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs p-3 bg-slate-900 border-slate-700"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                Guardian Score: {score}/100
              </span>
              <span className="text-xs text-slate-400">
                {getTimeAgo(lastScannedTs)}
              </span>
            </div>
            
            {topIssues.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-slate-300">
                  Top Issues:
                </div>
                <ul className="space-y-1">
                  {topIssues.map((issue, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex items-start gap-1">
                      <span className="text-slate-500">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {onClick && (
              <div className="pt-2 border-t border-slate-700">
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <Info className="w-3 h-3" />
                  <span>Click for full report</span>
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
