/**
 * Phase C Signal Row - Enhanced with must-fix items
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Clock, Zap } from 'lucide-react';
import { formatUsdCompact, timeAgo } from '@/lib/format';
import { trackEvent } from '@/lib/telemetry';
import type { Signal } from '@/types/signal';

interface SignalRowProps {
  signal: Signal;
  index?: number;
  showRank?: boolean;
  onExplain: (signal: Signal) => void;
  onCreateAlert: (signal: Signal) => void;
}

export function SignalRow({ signal, index, showRank, onExplain, onCreateAlert }: SignalRowProps) {
  const destination = signal.direction === 'outflow' ? 'exchange' : 'cold storage';
  const whyItMatters = signal.direction === 'outflow' ? 'often sell pressure' : 'often accumulation';
  const arrowColor = signal.direction === 'outflow' ? 'text-rose-500' : 'text-emerald-500';
  const isTopRank = showRank && index !== undefined && index < 3;
  const isHighImpact = signal.amountUsd > 10000000;
  const priceImpact = signal.direction === 'outflow' ? '±1–2%' : '±1–2%';
  const timeframe = '24h';
  
  const handleSourceTooltip = () => {
    trackEvent('row_source_tooltip_opened', { 
      signalId: signal.id, 
      source: signal.source 
    });
  };
  
  return (
    <div 
      className={`group grid grid-cols-[1.2fr_1fr_110px_92px] min-h-[72px] px-5 gap-3 rounded-xl border transition-all cursor-pointer items-center relative ${
        isTopRank 
          ? 'border-t-2 border-t-[var(--brand-teal,#14B8A6)] border-slate-200/70 dark:border-slate-800/70 scale-[1.04] bg-[var(--brand-teal,#14B8A6)]/5 hover:bg-[var(--brand-teal,#14B8A6)]/10' 
          : 'border-slate-200/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-900'
      }`}
      onClick={() => onExplain(signal)}
      role="listitem"
      aria-label={`${signal.asset} to ${destination}, ${formatUsdCompact(signal.amountUsd)}, ${timeAgo(signal.timestamp)}`}
    >
      {/* Column A: Icon + Asset + Direction */}
      <div className="flex items-center gap-2">
        {showRank && (
          <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0">
            #{index! + 1}
          </div>
        )}
        {signal.direction === 'outflow' ? (
          <ArrowDown className={`h-4 w-4 ${arrowColor}`} />
        ) : (
          <ArrowUp className={`h-4 w-4 ${arrowColor}`} />
        )}
        <div className="min-w-0">
          <div className="text-[15px]/[22px] font-medium text-slate-900 dark:text-slate-100 truncate">
            {signal.asset} {signal.direction === 'outflow' ? '↗' : '↘'} {destination}
          </div>
          {/* Why-in-one-line */}
          <div className="text-[11px]/[16px] text-slate-500 dark:text-slate-400 truncate">
            {destination === 'cold storage' ? 'Cold storage inflows' : 'Exchange outflows'} {whyItMatters}. Likely price drift: {priceImpact} next {timeframe}.
          </div>
        </div>
      </div>
      
      {/* Column B: Source + provenance */}
      <div className="-mt-0.5">
        <div className="flex items-center gap-1">
          <Badge 
            variant="outline" 
            className="text-[10px] px-1.5 py-0.5 cursor-help"
            onClick={(e) => { e.stopPropagation(); handleSourceTooltip(); }}
            title={`Source: ${signal.source} • ${signal.isLive ? 'Live' : 'Cached'} • Last refresh: ${timeAgo(signal.timestamp)}`}
          >
            {signal.source} • {signal.isLive ? 'Live' : 'Cached'}
          </Badge>
        </div>
      </div>
      
      {/* Column C: Amount (uniform anatomy) */}
      <div className="text-right">
        {/* Row 1: Total $ (bold) */}
        <div className="text-[15px] font-bold tabular-nums text-slate-900 dark:text-slate-100">
          {formatUsdCompact(signal.amountUsd)}
        </div>
        {/* Row 2: Risk level (muted) */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
          {signal.risk} risk
        </div>
      </div>
      
      {/* Column D: Time + latency (uniform anatomy) */}
      <div className="text-right">
        {/* Row 3: Time + latency */}
        <div className="flex items-center justify-end gap-1">
          <Clock className="h-3 w-3 text-slate-500" />
          <span className="text-[12px] text-slate-500">
            {timeAgo(signal.timestamp)}
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          {signal.isLive ? 'Live 0.8s' : 'Cached'}
        </div>
      </div>
      
      {/* Hover actions - only show Explain for high-impact */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
        {isHighImpact && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 px-2 text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 flex items-center gap-1"
            onClick={(e) => { e.stopPropagation(); onExplain(signal); }}
          >
            <Zap className="h-3 w-3" />
            Explain
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 px-2 text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
          onClick={(e) => { e.stopPropagation(); onCreateAlert(signal); }}
        >
          Alert
        </Button>
      </div>
    </div>
  );
}