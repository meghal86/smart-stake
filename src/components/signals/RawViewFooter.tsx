/**
 * Raw View Footer - Summary stats pinned at bottom
 */

import { TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';
import { formatUsdCompact } from '@/lib/format';
import type { Signal } from '@/types/signal';

interface RawViewFooterProps {
  signals: Signal[];
}

export function RawViewFooter({ signals }: RawViewFooterProps) {
  const inflows = signals.filter(s => s.direction === 'inflow');
  const outflows = signals.filter(s => s.direction === 'outflow');
  const totalVolume = signals.reduce((sum, s) => sum + s.amountUsd, 0);
  const uniqueAssets = new Set(signals.map(s => s.asset)).size;

  return (
    <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200/40 dark:border-slate-800 py-3">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-center gap-6 text-sm font-mono">
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span>{inflows.length} inflows</span>
          </div>
          
          <span className="text-slate-400">•</span>
          
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <TrendingDown className="h-4 w-4" />
            <span>{outflows.length} outflows</span>
          </div>
          
          <span className="text-slate-400">•</span>
          
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <DollarSign className="h-4 w-4" />
            <span>{formatUsdCompact(totalVolume)} moved</span>
          </div>
          
          <span className="text-slate-400">•</span>
          
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
            <Coins className="h-4 w-4" />
            <span>{uniqueAssets} assets</span>
          </div>
        </div>
      </div>
    </div>
  );
}