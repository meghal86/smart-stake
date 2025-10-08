/**
 * Signal Grouping Logic - Aggregate similar signals
 */

import type { Signal } from '@/types/signal';

export interface SignalGroup {
  key: string;
  signals: Signal[];
  asset: string;
  direction: 'inflow' | 'outflow';
  totalVolume: number;
  count: number;
  latestTimestamp: string;
}

export function groupSignals(signals: Signal[], windowMinutes = 10): SignalGroup[] {
  const groups = new Map<string, Signal[]>();
  
  signals.forEach(signal => {
    // Create grouping key: asset + direction + time window
    const timeWindow = Math.floor(new Date(signal.timestamp).getTime() / (windowMinutes * 60 * 1000));
    const key = `${signal.asset}-${signal.direction}-${timeWindow}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(signal);
  });
  
  return Array.from(groups.entries())
    .map(([key, signals]) => ({
      key,
      signals,
      asset: signals[0].asset,
      direction: signals[0].direction,
      totalVolume: signals.reduce((sum, s) => sum + s.amountUsd, 0),
      count: signals.length,
      latestTimestamp: signals.reduce((latest, s) => 
        new Date(s.timestamp) > new Date(latest) ? s.timestamp : latest, 
        signals[0].timestamp
      )
    }))
    .sort((a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime());
}

export function shouldGroup(signals: Signal[]): boolean {
  return signals.length > 1;
}