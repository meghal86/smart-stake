import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ConfidenceBarProps {
  value: number;
  band?: number;
}

export function ConfidenceBar({ value, band = 0.08 }: ConfidenceBarProps) {
  const pct = Math.round(value * 100);
  const left = Math.max(0, (value - band) * 100);
  const width = Math.min(100, (band * 2) * 100);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <div className="w-40 h-2 rounded bg-white/10 relative overflow-hidden">
              <div 
                className="absolute top-0 h-full bg-white/20" 
                style={{ left: `${left}%`, width: `${width}%` }} 
              />
              <div 
                className="h-full bg-cyan-400" 
                style={{ width: `${pct}%` }} 
              />
            </div>
            <span className="text-xs text-white/70">{pct}%</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confidence {pct}% ± {Math.round(band * 100)}% (bootstrap CI)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}