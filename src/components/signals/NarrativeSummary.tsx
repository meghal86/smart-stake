/**
 * Narrative Summary - Auto-generated market story
 */

import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Signal } from '@/types/signal';

interface NarrativeSummaryProps {
  signals: Signal[];
  timeWindow?: number; // minutes
}

export function NarrativeSummary({ signals, timeWindow = 60 }: NarrativeSummaryProps) {
  const recentSignals = signals.filter(s => {
    const signalTime = new Date(s.timestamp).getTime();
    const cutoff = Date.now() - (timeWindow * 60 * 1000);
    return signalTime > cutoff;
  });

  const totalVolume = recentSignals.reduce((sum, s) => sum + s.amountUsd, 0);
  const inflowVolume = recentSignals.filter(s => s.direction === 'inflow').reduce((sum, s) => sum + s.amountUsd, 0);
  const outflowVolume = recentSignals.filter(s => s.direction === 'outflow').reduce((sum, s) => sum + s.amountUsd, 0);
  
  const netFlow = inflowVolume - outflowVolume;
  const bias = netFlow > 0 ? 'accumulation' : 'distribution';
  const biasStrength = Math.abs(netFlow) / totalVolume;
  const biasPercentage = Math.round(biasStrength * 100);

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(0)}M`;
    return `$${(vol / 1e3).toFixed(0)}K`;
  };

  const getBiasColor = () => {
    if (bias === 'accumulation') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  };

  const getBiasIcon = () => {
    return bias === 'accumulation' ? TrendingUp : TrendingDown;
  };

  if (recentSignals.length === 0) {
    return (
      <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800 rounded-xl p-4 mb-6">
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          No whale activity in the last {timeWindow} minutes. Market appears quiet.
        </p>
      </div>
    );
  }

  const Icon = getBiasIcon();

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Badge className={`${getBiasColor()} flex items-center gap-1`}>
            <Icon className="h-3 w-3" />
            {bias === 'accumulation' ? 'Buy-side' : 'Sell-side'} +{biasPercentage}%
          </Badge>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 dark:text-slate-100 text-sm leading-relaxed">
            In the last {timeWindow === 60 ? 'hour' : `${timeWindow} minutes`}, whales moved{' '}
            <span className="font-semibold">{formatVolume(totalVolume)}</span> mostly{' '}
            {bias === 'accumulation' ? 'into cold storage' : 'to exchanges'} — historically linked to{' '}
            <span className="font-medium">{bias}</span>.
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Inflows: {formatVolume(inflowVolume)}</span>
            <span>•</span>
            <span>Outflows: {formatVolume(outflowVolume)}</span>
            <span>•</span>
            <span>{recentSignals.length} signals</span>
          </div>
        </div>
      </div>
    </div>
  );
}