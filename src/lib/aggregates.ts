/**
 * World-Class Aggregates - Tesla-level data insights
 */

import type { Signal } from '@/types/signal';

interface HourlyAverage {
  asset: string;
  destination: string;
  avgAmountUsd: number;
  avgCount: number;
  confidence: number;
}

interface ClusterStrength {
  groupId: string;
  strength: 'low' | 'medium' | 'high';
  txCount: number;
  windowMs: number;
  confidence: number;
}

interface HistoricalDrift {
  asset: string;
  direction: string;
  destination: string;
  medianDrift24h: number;
  confidence: number;
  sampleSize: number;
}

// Cache for performance
const cache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getHourlyAverages(
  asset: string, 
  destination: string
): Promise<HourlyAverage> {
  const cacheKey = `hourly_${asset}_${destination}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // In production, this would call /functions/signal-aggregates
    // For now, return realistic mock data
    const mockData: HourlyAverage = {
      asset,
      destination,
      avgAmountUsd: Math.random() * 50000000 + 10000000, // 10-60M
      avgCount: Math.floor(Math.random() * 10) + 3, // 3-13 transactions
      confidence: Math.floor(Math.random() * 20) + 75, // 75-95%
    };

    cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
    return mockData;
  } catch (error) {
    // Fallback to neutral statistics
    return {
      asset,
      destination,
      avgAmountUsd: 25000000,
      avgCount: 5,
      confidence: 80,
    };
  }
}

export async function getClusterStrength(
  groupId: string, 
  windowMs: number
): Promise<ClusterStrength> {
  const cacheKey = `cluster_${groupId}_${windowMs}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const txCount = Math.floor(Math.random() * 20) + 5; // 5-25 transactions
    let strength: 'low' | 'medium' | 'high' = 'medium';
    
    if (txCount >= 15) strength = 'high';
    else if (txCount <= 8) strength = 'low';

    const mockData: ClusterStrength = {
      groupId,
      strength,
      txCount,
      windowMs,
      confidence: Math.floor(Math.random() * 15) + 80, // 80-95%
    };

    cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
    return mockData;
  } catch (error) {
    return {
      groupId,
      strength: 'medium',
      txCount: 10,
      windowMs,
      confidence: 85,
    };
  }
}

export async function getHistoricalDrift(
  asset: string,
  direction: string,
  destination: string,
  lookbackDays: number = 30
): Promise<HistoricalDrift> {
  const cacheKey = `drift_${asset}_${direction}_${destination}_${lookbackDays}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Simulate realistic price drift patterns
    const isAccumulation = destination === 'cold storage';
    const baseDrift = isAccumulation ? 1.4 : -0.8; // Accumulation tends positive
    const variance = Math.random() * 2 - 1; // ±1%
    
    const mockData: HistoricalDrift = {
      asset,
      direction,
      destination,
      medianDrift24h: baseDrift + variance,
      confidence: Math.floor(Math.random() * 20) + 70, // 70-90%
      sampleSize: Math.floor(Math.random() * 50) + 20, // 20-70 historical events
    };

    cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
    return mockData;
  } catch (error) {
    return {
      asset,
      direction,
      destination,
      medianDrift24h: 0,
      confidence: 75,
      sampleSize: 30,
    };
  }
}

export function calculateMultiplier(
  currentAmount: number,
  hourlyAverage: number
): number {
  if (hourlyAverage === 0) return 1;
  return Math.max(currentAmount / hourlyAverage, 0.1);
}

export function generateSparklineHistory(
  asset: string,
  direction: string,
  hours: number = 6
): number[] {
  const points = hours * 2; // 30-minute intervals
  const baseValue = 50;
  const trend = direction === 'inflow' ? 1 : -1;
  
  return Array.from({ length: points }, (_, i) => {
    const trendComponent = trend * (i / points) * 20;
    const randomComponent = (Math.random() - 0.5) * 30;
    return Math.max(baseValue + trendComponent + randomComponent, 10);
  });
}

// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);