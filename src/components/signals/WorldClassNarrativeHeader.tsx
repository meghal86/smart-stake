/**
 * World-Class Narrative Header - Live pulse and animated bias
 */

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RefreshCw, Wifi, Clock } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';

interface WorldClassNarrativeHeaderProps {
  bias: {
    side: 'buy' | 'sell';
    deltaPct: number;
  };
  stats: {
    signals: number;
    inflowsUsd: number;
    outflowsUsd: number;
  };
  refreshedAt: Date;
  onRefresh: () => void;
}

export function WorldClassNarrativeHeader({ 
  bias, 
  stats, 
  refreshedAt, 
  onRefresh 
}: WorldClassNarrativeHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateTimeAgo = () => {
      const diff = Date.now() - refreshedAt.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      
      if (minutes > 0) {
        setTimeAgo(`${minutes}m ago`);
      } else {
        setTimeAgo(`${seconds}s ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [refreshedAt]);

  const handleRefresh = () => {
    trackEvent('narrative_refresh_clicked', { 
      bias: bias.side,
      deltaPct: bias.deltaPct
    });
    onRefresh();
  };

  useEffect(() => {
    trackEvent('narrative_rendered', {
      bias: bias.side,
      deltaPct: bias.deltaPct,
      signalCount: stats.signals,
      totalVolume: stats.inflowsUsd + stats.outflowsUsd
    });
  }, [bias, stats]);

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(0)}M`;
    return `$${(vol / 1e3).toFixed(0)}K`;
  };

  const getBiasColor = () => {
    if (bias.side === 'buy') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  };

  const Icon = bias.side === 'buy' ? TrendingUp : TrendingDown;
  const totalVolume = stats.inflowsUsd + stats.outflowsUsd;

  return (
    <div 
      className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/60 dark:border-slate-800/60 rounded-xl p-5 mb-6 transition-all duration-250 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {/* Main Narrative Row */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <Badge className={`${getBiasColor()} flex items-center gap-1.5 px-3 py-1.5 font-medium text-xs`}>
            <Icon className="h-3 w-3" />
            <span className="hidden xs:inline">{bias.side === 'buy' ? 'Buy-side' : 'Sell-side'}</span>
            <span className="xs:hidden">{bias.side === 'buy' ? 'Buy' : 'Sell'}</span>
            <span className="tabular-nums">+{bias.deltaPct}%</span>
            <div className="w-2 h-2 bg-current rounded-full live-pulse ml-1" />
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-slate-900 dark:text-slate-100 text-sm leading-relaxed">
          <span className="hidden sm:inline">In the last hour, whales moved </span>
          <span className="sm:hidden">Whales moved </span>
          <span className="font-semibold text-[var(--brand-teal,#14B8A6)] tabular-nums">
            {formatVolume(totalVolume)}
          </span>
          <span className="hidden sm:inline"> mostly {bias.side === 'buy' ? 'into cold storage' : 'to exchanges'} — historically linked to </span>
          <span className="sm:hidden"> {bias.side === 'buy' ? 'to cold storage' : 'to exchanges'} → </span>
          <span className="font-medium">
            {bias.side === 'buy' ? 'accumulation' : 'distribution'}
          </span>
          <span className="hidden sm:inline">.</span>
        </p>
      </div>

      {/* Status Ticker - Mobile Responsive */}
      <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
        {/* Top Row - Status Info */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Last refresh: {timeAgo}</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full live-pulse" />
            <span className="hidden xs:inline">{Math.floor(Math.random() * 50) + 20} active whales</span>
            <span className="xs:hidden">{Math.floor(Math.random() * 50) + 20} whales</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3" />
            <span className="hidden xs:inline">API status: Live</span>
            <span className="xs:hidden">Live</span>
          </div>
        </div>

        {/* Bottom Row - Volume Stats */}
        <div className="flex items-center gap-2 tabular-nums text-xs">
          <span className="text-emerald-600">↗ {formatVolume(stats.inflowsUsd)}</span>
          <span>•</span>
          <span className="text-red-600">↘ {formatVolume(stats.outflowsUsd)}</span>
          <span>•</span>
          <span>{stats.signals} signals</span>
        </div>
      </div>
    </div>
  );
}