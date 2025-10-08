/**
 * Header Digest - Unified narrative with trend chart and search
 */

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Search, BarChart3 } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';
import type { Signal } from '@/types/signal';

interface HeaderDigestProps {
  signals: Signal[];
  timeWindow?: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

export function HeaderDigest({ 
  signals, 
  timeWindow = 60, 
  searchQuery, 
  onSearchChange,
  sortBy,
  onSortChange
}: HeaderDigestProps) {
  const [isVisible, setIsVisible] = useState(false);

  useState(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  });

  const recentSignals = useMemo(() => 
    signals.filter(s => {
      const signalTime = new Date(s.timestamp).getTime();
      const cutoff = Date.now() - (timeWindow * 60 * 1000);
      return signalTime > cutoff;
    }), [signals, timeWindow]
  );

  const stats = useMemo(() => {
    const totalVolume = recentSignals.reduce((sum, s) => sum + s.amountUsd, 0);
    const inflowVolume = recentSignals.filter(s => s.direction === 'inflow').reduce((sum, s) => sum + s.amountUsd, 0);
    const outflowVolume = recentSignals.filter(s => s.direction === 'outflow').reduce((sum, s) => sum + s.amountUsd, 0);
    
    const netFlow = inflowVolume - outflowVolume;
    const bias = netFlow > 0 ? 'accumulation' : 'distribution';
    const biasStrength = Math.abs(netFlow) / totalVolume;
    const biasPercentage = Math.round(biasStrength * 100);

    return { totalVolume, inflowVolume, outflowVolume, bias, biasPercentage };
  }, [recentSignals]);

  const trendData = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => {
      const baseValue = 50;
      const trend = stats.bias === 'accumulation' ? 1 : -1;
      return baseValue + (Math.random() - 0.5) * 20 + trend * (i / 12) * 15;
    }), [stats.bias]
  );

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(0)}M`;
    return `$${(vol / 1e3).toFixed(0)}K`;
  };

  const getBiasColor = () => {
    if (stats.bias === 'accumulation') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  };

  const Icon = stats.bias === 'accumulation' ? TrendingUp : TrendingDown;

  return (
    <div 
      className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5 mb-6 transition-all duration-250 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {/* Narrative Row */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0">
          <Badge className={`${getBiasColor()} flex items-center gap-1.5 px-3 py-1.5 font-medium text-xs`}>
            <Icon className="h-3 w-3" />
            {stats.bias === 'accumulation' ? 'Buy-side' : 'Sell-side'} +{stats.biasPercentage}%
          </Badge>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 dark:text-slate-100 text-sm leading-relaxed mb-2">
            In the last {timeWindow === 60 ? 'hour' : `${timeWindow} minutes`}, whales moved{' '}
            <span className="font-semibold text-[var(--brand-teal,#14B8A6)] tabular-nums">{formatVolume(stats.totalVolume)}</span> mostly{' '}
            {stats.bias === 'accumulation' ? 'into cold storage' : 'to exchanges'} — historically linked to{' '}
            <span className="font-medium">{stats.bias}</span>.
          </p>
        </div>

        {/* Mini Trend Chart */}
        <div className="flex items-end gap-0.5 h-8">
          {trendData.map((value, i) => (
            <div
              key={i}
              className="w-1.5 bg-[var(--brand-teal,#14B8A6)] rounded-sm transition-all duration-300"
              style={{ 
                height: `${Math.max((value / 80) * 100, 10)}%`,
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tokens, direction, chain..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                trackEvent('search_applied', { query: e.target.value });
              }}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>

        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="volume">By Volume</SelectItem>
            <SelectItem value="confidence">By Confidence</SelectItem>
            <SelectItem value="time">By Time</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            <span>{recentSignals.length} signals</span>
          </div>
          <span>•</span>
          <span>↗ {formatVolume(stats.inflowVolume)}</span>
          <span>•</span>
          <span>↘ {formatVolume(stats.outflowVolume)}</span>
        </div>
      </div>
    </div>
  );
}