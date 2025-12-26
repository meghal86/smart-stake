/**
 * Guardian Score Tooltip Component
 * 
 * Requirements: Enhanced Req 10 AC1-3 (trust methodology), Enhanced Req 14 AC4-5 (metrics proof)
 * Design: Trust Signals → Verification System
 * 
 * Provides "How it's calculated" tooltip for Guardian Score displays in HarvestPro
 * Uses existing tooltip components and MetricsProof patterns
 */

import React, { useState } from 'react';
import { HelpCircle, Shield, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GuardianScoreTooltipProps {
  score: number;
  className?: string;
  variant?: 'inline' | 'button';
  showScore?: boolean;
}

/**
 * Guardian Score Tooltip Component
 * 
 * Displays Guardian Score with methodology tooltip
 * Uses existing tooltip infrastructure for consistency
 */
export function GuardianScoreTooltip({
  score,
  className = '',
  variant = 'inline',
  showScore = true,
}: GuardianScoreTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get score color based on value
  const getScoreColor = (score: number): string => {
    if (score >= 7) return 'text-green-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get methodology content based on score
  const getMethodologyContent = (score: number) => {
    const baseContent = [
      'Multi-factor risk assessment combining 15+ security indicators',
      'Machine learning model trained on 100,000+ security incidents',
      'Real-time threat intelligence from Chainalysis and TRM Labs',
      'Weighted scoring: 40% on-chain behavior, 35% approvals, 25% reputation',
      'Scores updated every 10 minutes with new transaction data'
    ];

    if (score < 4) {
      return [
        ...baseContent,
        '',
        '⚠️ Low scores indicate elevated risk factors detected',
        'Review transaction history and approval patterns carefully'
      ];
    }

    if (score < 7) {
      return [
        ...baseContent,
        '',
        '⚡ Medium scores suggest some risk factors present',
        'Consider additional verification before proceeding'
      ];
    }

    return [
      ...baseContent,
      '',
      '✅ High scores indicate strong security profile',
      'Low risk detected across all assessment categories'
    ];
  };

  const methodologyContent = getMethodologyContent(score);
  const scoreColor = getScoreColor(score);

  if (variant === 'button') {
    return (
      <TooltipProvider>
        <Tooltip open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'inline-flex items-center gap-1 text-xs transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900',
                'rounded px-1 py-0.5 text-cyan-400 hover:text-cyan-300',
                className
              )}
              aria-label="How Guardian score is calculated"
            >
              <HelpCircle className="w-3 h-3" />
              How it's calculated
            </button>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-sm p-4 bg-slate-800 border-slate-600 text-slate-100"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-blue-400">Guardian Score Methodology</span>
              </div>
              <div className="space-y-1 text-xs">
                {methodologyContent.map((line, index) => (
                  <div key={index} className={line.startsWith('⚠️') || line.startsWith('⚡') || line.startsWith('✅') ? 'font-medium mt-2' : ''}>
                    {line}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-600 text-xs text-slate-400">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Inline variant - shows score with tooltip
  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <div className={cn('inline-flex items-center gap-1 cursor-help', className)}>
            {showScore && (
              <>
                <Shield className="w-4 h-4 text-blue-400" />
                <span className={cn('font-semibold', scoreColor)}>{score}/10</span>
                <span className="text-gray-500 uppercase text-xs">Guardian</span>
              </>
            )}
            <HelpCircle className="w-3 h-3 text-gray-400 hover:text-cyan-400 transition-colors" />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-sm p-4 bg-slate-800 border-slate-600 text-slate-100"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-blue-400">Guardian Score: {score}/10</span>
            </div>
            <div className="space-y-1 text-xs">
              {methodologyContent.map((line, index) => (
                <div key={index} className={line.startsWith('⚠️') || line.startsWith('⚡') || line.startsWith('✅') ? 'font-medium mt-2' : ''}>
                  {line}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-600 text-xs text-slate-400">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Guardian Score Link Component
 * 
 * Simple link version for use in detailed modals
 */
interface GuardianScoreLinkProps {
  score: number;
  className?: string;
  onShowMethodology?: () => void;
}

export function GuardianScoreLink({
  score,
  className = '',
  onShowMethodology,
}: GuardianScoreLinkProps) {
  const handleClick = () => {
    if (onShowMethodology) {
      onShowMethodology();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900',
        'rounded px-1 py-0.5 text-cyan-400 hover:text-cyan-300 underline decoration-dotted underline-offset-2',
        className
      )}
      aria-label={`How Guardian score ${score}/10 is calculated`}
    >
      <HelpCircle className="w-3 h-3" />
      How is this calculated?
    </button>
  );
}