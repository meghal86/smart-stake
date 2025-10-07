/**
 * Signal Processing Utilities
 */

import type { Signal, SignalGroup } from '@/types/signal';

/**
 * Calculate impact score for signal sorting
 * Formula: ln(amountUsd) * directionWeight * sourceWeight
 */
export function calculateImpactScore(signal: Signal): number {
  const directionWeights: Record<string, number> = {
    outflow: 1.5,
    distribution: 1.3,
    accumulation: 1.2,
    inflow: 1.0,
    neutral: 0.8,
  };

  const sourceWeights: Record<string, number> = {
    'whale_alert': 1.2,
    'etherscan': 1.0,
    'internal': 0.9,
  };

  const amount = Math.max(signal.amountUsd, 1);
  const directionWeight = directionWeights[signal.direction] || 1.0;
  const sourceWeight = sourceWeights[signal.source.toLowerCase()] || 1.0;

  return Math.log(amount) * directionWeight * sourceWeight;
}

/**
 * Check if two signals should be grouped together
 * Criteria: same asset, same direction, ±10% amount, within 10min
 */
export function shouldGroupSignals(s1: Signal, s2: Signal): boolean {
  if (s1.asset !== s2.asset || s1.direction !== s2.direction) return false;

  const amountDiff = Math.abs(s1.amountUsd - s2.amountUsd) / Math.max(s1.amountUsd, s2.amountUsd);
  if (amountDiff > 0.1) return false;

  const timeDiff = Math.abs(new Date(s1.timestamp).getTime() - new Date(s2.timestamp).getTime());
  return timeDiff <= 10 * 60 * 1000; // 10 minutes
}

/**
 * Generate group key for signal grouping
 */
export function getGroupKey(signal: Signal): string {
  const amount = Math.floor(signal.amountUsd / 1000) * 1000; // Round to nearest 1k
  return `${signal.asset}_${signal.direction}_${amount}`;
}

/**
 * Group signals by similarity
 */
export function groupSignals(signals: Signal[]): SignalGroup[] {
  const groups = new Map<string, Signal[]>();

  for (const signal of signals) {
    const key = getGroupKey(signal);
    const existing = groups.get(key) || [];
    existing.push(signal);
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([key, sigs]) => ({
    key,
    signals: sigs,
    latestTimestamp: sigs.reduce((latest, s) => 
      s.timestamp > latest ? s.timestamp : latest, sigs[0].timestamp
    ),
    totalAmountUsd: sigs.reduce((sum, s) => sum + s.amountUsd, 0),
    count: sigs.length,
  }));
}

/**
 * Check for duplicate signals
 * Criteria: same txHash OR (same from, to, amount within 120s)
 */
export function isDuplicate(signal: Signal, existing: Signal[]): boolean {
  return existing.some(s => {
    if (signal.txHash && s.txHash === signal.txHash) return true;
    
    if (signal.from && signal.to && s.from === signal.from && s.to === signal.to) {
      const timeDiff = Math.abs(new Date(signal.timestamp).getTime() - new Date(s.timestamp).getTime());
      return timeDiff <= 120 * 1000; // 120 seconds
    }
    
    return false;
  });
}

/**
 * Mask wallet address for privacy
 */
export function maskAddress(address?: string): string {
  if (!address) return 'Unknown';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format relative time
 */
export function formatRelativeTime(timestamp: string, locale = 'en'): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
}

/**
 * Sort signals by impact score (descending)
 */
export function sortByImpact(signals: Signal[]): Signal[] {
  return [...signals].sort((a, b) => {
    const scoreA = a.impactScore ?? calculateImpactScore(a);
    const scoreB = b.impactScore ?? calculateImpactScore(b);
    return scoreB - scoreA;
  });
}
