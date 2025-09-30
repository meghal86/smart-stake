import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OutcomeBadgeProps {
  wasCorrect: boolean;
  pct: number;
  realizedTs?: string;
}

export default function OutcomeBadge({ wasCorrect, pct, realizedTs }: OutcomeBadgeProps) {
  const color = wasCorrect ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10';
  const sign = wasCorrect ? '+' : '';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${color} cursor-help`}>
            {wasCorrect ? '✓' : '✗'} {sign}{(pct * 100).toFixed(1)}%
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Measured at horizon end (6h)</p>
          {realizedTs && <p className="text-xs opacity-75">{new Date(realizedTs).toLocaleString()}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}