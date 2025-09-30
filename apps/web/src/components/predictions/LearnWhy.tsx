import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LearnWhyProps {
  topic: 'whale-volume' | 'sentiment' | 'liquidity';
}

const explanations = {
  'whale-volume': 'Sharp increases in whale accumulation often precede 2–6h volatility as liquidity thins and order books chase momentum.',
  'sentiment': 'Positive social/news momentum can amplify whale-led moves, especially when funding rates are neutral to positive.',
  'liquidity': 'Thin depth near key levels increases the chance of stop runs and exaggerated wicks—watch liquidation heatmaps.'
};

export function LearnWhy({ topic }: LearnWhyProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-help">
            <Info className="h-4 w-4" />
            <span className="hidden md:inline">Why this matters</span>
            <span className="md:hidden">Info</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{explanations[topic]}</p>
          <p className="text-xs mt-1 opacity-75">
            <a href="/docs/predictions" className="underline">Learn more</a>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}