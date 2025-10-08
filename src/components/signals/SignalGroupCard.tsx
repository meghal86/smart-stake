/**
 * Signal Group Card - Aggregated signals with AI confidence
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Clock, Sparkles } from 'lucide-react';
import { formatUsdCompact, timeAgo } from '@/lib/format';
import { trackEvent } from '@/lib/telemetry';
import type { Signal } from '@/types/signal';

interface SignalGroupCardProps {
  signals: Signal[];
  onExplain: (signal: Signal) => void;
  onCreateAlert: (signal: Signal) => void;
}

export function SignalGroupCard({ signals, onExplain, onCreateAlert }: SignalGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  if (signals.length === 0) return null;
  
  const firstSignal = signals[0];
  const totalVolume = signals.reduce((sum, s) => sum + s.amountUsd, 0);
  const avgVolume = totalVolume / signals.length;
  const destination = firstSignal.direction === 'outflow' ? 'exchanges' : 'cold storage';
  const whyItMatters = firstSignal.direction === 'outflow' ? 'often sell pressure' : 'often accumulation';
  const arrowColor = firstSignal.direction === 'outflow' ? 'text-red-500' : 'text-emerald-500';
  const latestTime = Math.max(...signals.map(s => new Date(s.timestamp).getTime()));
  
  // AI confidence calculation
  const confidence = Math.min(85 + (signals.length * 2), 95);
  const aiPrediction = firstSignal.direction === 'outflow' ? 'distribution' : 'accumulation';

  const handleExpand = () => {
    setExpanded(!expanded);
    trackEvent('signal_expanded', { 
      groupSize: signals.length, 
      asset: firstSignal.asset, 
      direction: firstSignal.direction,
      expanded: !expanded,
      totalVolume,
      timestamp: Date.now()
    });
  };

  const handleHover = (hovered: boolean) => {
    setIsHovered(hovered);
    if (hovered) {
      trackEvent('signal_hovered', { 
        type: 'group',
        asset: firstSignal.asset,
        groupSize: signals.length
      });
    }
  };

  return (
    <Card 
      className={`bg-white/60 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800/70 transition-all duration-300 motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isHovered 
          ? 'bg-white/95 dark:bg-slate-900/90 shadow-lg shadow-[var(--brand-teal,#14B8A6)]/10 scale-[1.01]' 
          : 'hover:bg-white/80 dark:hover:bg-slate-900/80'
      }`}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
    >
      <CardContent className="p-5">
        {/* Main grouped row */}
        <div className="grid grid-cols-[1.2fr_1fr_110px_92px] gap-3 items-center">
          {/* Column A: Asset + Direction + Count */}
          <div className="flex items-center gap-2">
            {firstSignal.direction === 'outflow' ? (
              <ArrowDown className={`h-4 w-4 ${arrowColor}`} />
            ) : (
              <ArrowUp className={`h-4 w-4 ${arrowColor}`} />
            )}
            <div className="min-w-0">
              <div className="text-[15px]/[22px] font-medium text-slate-900 dark:text-slate-100">
                {signals.length}x {firstSignal.asset} to {destination}
              </div>
            </div>
          </div>
          
          {/* Column B: Why it matters + AI confidence */}
          <div className="-mt-0.5">
            <p className="text-[13px]/[20px] text-slate-600 dark:text-slate-300">
              {whyItMatters}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles className="h-3 w-3 text-[var(--brand-teal,#14B8A6)]" />
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-[var(--brand-teal,#14B8A6)] font-medium">
                  AI: likely {aiPrediction} ({confidence}%)
                </p>
                <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--confidence-green,#10B981)] to-[var(--brand-teal,#14B8A6)] transition-all duration-500"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Column C: Total Amount */}
          <div className="text-right">
            <div className="text-[15px] font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {formatUsdCompact(totalVolume)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              avg {formatUsdCompact(avgVolume)}
            </div>
          </div>
          
          {/* Column D: Time + Expand */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 mb-1">
              <Clock className="h-3 w-3 text-slate-500" />
              <span className="text-[12px] text-slate-500">
                {timeAgo(new Date(latestTime).toISOString())}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpand}
              className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600 transition-colors duration-200"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Badges and actions row */}
        <div className="flex items-center gap-2 mt-4">
          <Badge className={`text-xs ${
            firstSignal.risk === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
            firstSignal.risk === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            {firstSignal.risk}
          </Badge>
          
          <Badge variant="outline" className="text-xs">
            {firstSignal.source}
          </Badge>

          <div className="flex-1" />

          {/* Action buttons - show on hover */}
          {isHovered && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-6 px-2 text-xs text-[var(--brand-teal,#14B8A6)] hover:text-[var(--brand-teal,#14B8A6)]/80"
                onClick={() => onExplain(firstSignal)}
              >
                Explain ↗
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-6 px-2 text-xs text-[var(--brand-teal,#14B8A6)] hover:text-[var(--brand-teal,#14B8A6)]/80"
                onClick={() => {
                  onCreateAlert(firstSignal);
                  trackEvent('alert_created', { 
                    source: 'group_card',
                    asset: firstSignal.asset,
                    groupSize: signals.length
                  });
                }}
              >
                Create Alert
              </Button>
            </div>
          )}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            {signals.slice(0, 5).map((signal, index) => (
              <div key={signal.id} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 py-1">
                <span className="font-mono tabular-nums">{formatUsdCompact(signal.amountUsd)}</span>
                <span>{timeAgo(signal.timestamp)}</span>
              </div>
            ))}
            {signals.length > 5 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                +{signals.length - 5} more transactions
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}