/**
 * Formatting utilities for A++++ signals experience
 */

export function formatUsdCompact(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

export function timeAgo(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function getWhyItMatters(direction: string, destination: string): string {
  if (direction === 'outflow' && destination === 'exchange') {
    return 'Sell-side supply ↑ short-term';
  }
  if (direction === 'inflow' && destination === 'cold') {
    return 'Self-custody accumulation (sell pressure ↓)';
  }
  if (direction === 'outflow' && destination === 'cold') {
    return 'Exchange withdrawal (supply ↓)';
  }
  return 'Large whale movement detected';
}

export function fmt(value: number): string {
  if (value >= 1000) return (value / 1000).toFixed(1);
  return value.toFixed(1);
}

export function showDelta(delta: number): boolean {
  return Math.abs(delta) > 0.1;
}