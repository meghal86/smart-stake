/**
 * Grouped Signal Card - Aggregates similar signals
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { formatUsdCompact, timeAgo } from '@/lib/format';
import type { Signal } from '@/types/signal';

interface GroupedSignalCardProps {
  signals: Signal[];
  onExplain: (signal: Signal) => void;
  onCreateAlert: (signal: Signal) => void;
}

export function GroupedSignalCard({ signals, onExplain, onCreateAlert }: GroupedSignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (signals.length === 0) return null;
  
  const firstSignal = signals[0];
  const totalVolume = signals.reduce((sum, s) => sum + s.amountUsd, 0);
  const avgVolume = totalVolume / signals.length;
  const destination = firstSignal.direction === 'outflow' ? 'exchanges' : 'cold storage';
  const whyItMatters = firstSignal.direction === 'outflow' ? 'often sell pressure' : 'often accumulation';
  const arrowColor = firstSignal.direction === 'outflow' ? 'text-rose-500' : 'text-emerald-500';
  const latestTime = Math.max(...signals.map(s => new Date(s.timestamp).getTime()));

  return (
    <Card className="bg-white/60 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800/70 hover:bg-white/95 dark:hover:bg-slate-900/90 hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
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
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-0.5">
              AI says likely {firstSignal.direction === 'outflow' ? 'distribution' : 'accumulation'} (85% confidence)
            </p>
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
              onClick={() => setExpanded(!expanded)}
              className="h-5 w-5 p-0 text-slate-400 hover:text-slate-600"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 mt-3">
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

          {/* Action buttons */}
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 px-2 text-xs text-cyan-600 hover:text-cyan-700"
            onClick={() => onExplain(firstSignal)}
          >
            Explain ↗
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 px-2 text-xs text-cyan-600 hover:text-cyan-700"
            onClick={() => onCreateAlert(firstSignal)}
          >
            Create Alert
          </Button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800 space-y-2">
            {signals.slice(0, 5).map((signal, index) => (
              <div key={signal.id} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>{formatUsdCompact(signal.amountUsd)}</span>
                <span>{timeAgo(signal.timestamp)}</span>
              </div>
            ))}
            {signals.length > 5 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                +{signals.length - 5} more transactions
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}