/**
 * Narrative Header - Auto-generated market story with bias indicator
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';
import type { Signal } from '@/types/signal';

interface NarrativeHeaderProps {
  signals: Signal[];
  timeWindow?: number;
}

export function NarrativeHeader({ signals, timeWindow = 60 }: NarrativeHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (signals.length > 0) {
      trackEvent('narrative_rendered', { 
        signalCount: signals.length, 
        timeWindow,
        totalVolume: signals.reduce((sum, s) => sum + s.amountUsd, 0)
      });
    }
  }, [signals, timeWindow]);

  const recentSignals = signals.filter(s => {
    const signalTime = new Date(s.timestamp).getTime();
    const cutoff = Date.now() - (timeWindow * 60 * 1000);
    return signalTime > cutoff;
  });

  if (recentSignals.length === 0) return null;

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

  const Icon = bias === 'accumulation' ? TrendingUp : TrendingDown;

  return (
    <div 
      className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5 mb-6 transition-all duration-300 motion-safe:animate-in motion-safe:fade-in-0 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      role="region"
      aria-label="Market narrative summary"
      style={{
        animationDuration: '250ms',
        animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Badge className={`${getBiasColor()} flex items-center gap-1.5 px-3 py-1.5 font-medium text-xs`}>
            <Icon className="h-3 w-3" />
            {bias === 'accumulation' ? 'Buy-side' : 'Sell-side'} +{biasPercentage}%
          </Badge>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 dark:text-slate-100 text-sm leading-relaxed mb-2">
            In the last {timeWindow === 60 ? 'hour' : `${timeWindow} minutes`}, whales moved{' '}
            <span className="font-semibold text-[var(--brand-teal,#14B8A6)]">{formatVolume(totalVolume)}</span> mostly{' '}
            {bias === 'accumulation' ? 'into cold storage' : 'to exchanges'} — historically linked to{' '}
            <span className="font-medium">{bias}</span>.
          </p>
          
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>{recentSignals.length} signals</span>
            </div>
            <span>•</span>
            <span>Inflows: {formatVolume(inflowVolume)}</span>
            <span>•</span>
            <span>Outflows: {formatVolume(outflowVolume)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}