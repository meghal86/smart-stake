/**
 * Raw View Dividers - Minute/asset bucket headers
 */

import { Clock, Coins } from 'lucide-react';
import type { Signal } from '@/types/signal';

interface RawViewDividersProps {
  signals: Signal[];
  groupBy: 'time' | 'asset';
}

export function RawViewDividers({ signals, groupBy }: RawViewDividersProps) {
  const groupedSignals = groupBy === 'time' 
    ? groupSignalsByMinute(signals)
    : groupSignalsByAsset(signals);

  return (
    <div className="space-y-1">
      {Object.entries(groupedSignals).map(([key, groupSignals]) => (
        <div key={key}>
          {/* Divider header */}
          <div className="flex items-center gap-2 py-2 px-3 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/40 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {groupBy === 'time' ? (
              <>
                <Clock className="h-3 w-3" />
                {key} • {groupSignals.length} signals
              </>
            ) : (
              <>
                <Coins className="h-3 w-3" />
                {key} ({groupSignals.length})
              </>
            )}
          </div>
          
          {/* Signal rows */}
          {groupSignals.map((signal, index) => (
            <div 
              key={`${signal.id}-${index}`}
              className="flex items-center justify-between p-3 border-b border-slate-200/40 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer text-sm font-mono transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="w-16 font-semibold text-slate-900 dark:text-slate-100">{signal.asset}</span>
                <span className={`w-20 font-medium ${
                  signal.direction === 'outflow' ? 'text-red-500' : 'text-emerald-500'
                }`}>
                  {signal.direction}
                </span>
                <span className="w-24 text-slate-700 dark:text-slate-300 font-mono tabular-nums text-right">
                  ${(signal.amountUsd / 1e6).toFixed(1)}M
                </span>
                <span className="w-16 text-slate-600 dark:text-slate-400">{signal.source}</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date(signal.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function groupSignalsByMinute(signals: Signal[]): Record<string, Signal[]> {
  return signals.reduce((groups, signal) => {
    const date = new Date(signal.timestamp);
    const key = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(signal);
    return groups;
  }, {} as Record<string, Signal[]>);
}

function groupSignalsByAsset(signals: Signal[]): Record<string, Signal[]> {
  return signals.reduce((groups, signal) => {
    if (!groups[signal.asset]) groups[signal.asset] = [];
    groups[signal.asset].push(signal);
    return groups;
  }, {} as Record<string, Signal[]>);
}