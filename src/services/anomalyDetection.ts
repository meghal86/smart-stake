/**
 * Advanced Anomaly Detection Service for Whale Behavior
 * 
 * This service implements statistical and ML-based pattern recognition
 * to detect unusual whale activities and market anomalies.
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface AnomalyResult {
  anomalyId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  type: AnomalyType;
  description: string;
  affectedWhales: string[];
  metrics: Record<string, number>;
  timestamp: string;
  suggestedActions: string[];
}

export type AnomalyType =
  | 'volume_spike'
  | 'velocity_anomaly'
  | 'cluster_behavior'
  | 'dormant_activation'
  | 'mass_transfer'
  | 'coordinated_movement'
  | 'balance_deviation'
  | 'unusual_pattern';

interface WhaleMetrics {
  address: string;
  chain: string;
  balance_usd: number;
  transfer_count_24h: number;
  transfer_volume_24h: number;
  avg_transfer_size: number;
  unique_counterparties: number;
  cex_interaction_ratio: number;
  last_activity_timestamp: string;
}

interface StatisticalBaseline {
  mean: number;
  stdDev: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
}

// ============================================================================
// Statistical Functions
// ============================================================================

/**
 * Calculate z-score for anomaly detection
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate statistical baseline from historical data
 */
function calculateBaseline(values: number[]): StatisticalBaseline {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, median: 0, q1: 0, q3: 0, iqr: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)];
  
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  return { mean, stdDev, median, q1, q3, iqr };
}

/**
 * Modified Z-Score using Median Absolute Deviation (MAD)
 * More robust to outliers than standard z-score
 */
function calculateModifiedZScore(value: number, values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  const deviations = values.map(v => Math.abs(v - median));
  const mad = deviations.sort((a, b) => a - b)[Math.floor(deviations.length / 2)];
  
  if (mad === 0) return 0;
  
  return 0.6745 * (value - median) / mad;
}

/**
 * Isolation Forest-inspired anomaly score
 * Simplified version for browser environment
 */
function calculateIsolationScore(point: number[], dataset: number[][]): number {
  if (dataset.length === 0) return 0;
  
  // Calculate average path length to isolate the point
  let totalPathLength = 0;
  const iterations = Math.min(100, dataset.length);
  
  for (let i = 0; i < iterations; i++) {
    let pathLength = 0;
    let subset = [...dataset];
    
    // Simulate tree traversal
    while (subset.length > 1 && pathLength < 10) {
      const dim = Math.floor(Math.random() * point.length);
      const splitValue = subset[Math.floor(Math.random() * subset.length)][dim];
      
      const side = point[dim] < splitValue ? 'left' : 'right';
      subset = subset.filter(p => 
        side === 'left' ? p[dim] < splitValue : p[dim] >= splitValue
      );
      
      pathLength++;
    }
    
    totalPathLength += pathLength;
  }
  
  const avgPathLength = totalPathLength / iterations;
  const c = 2 * (Math.log(dataset.length - 1) + 0.5772156649) - (2 * (dataset.length - 1) / dataset.length);
  
  return Math.pow(2, -avgPathLength / c);
}

// ============================================================================
// Data Fetching
// ============================================================================

/**
 * Fetch whale metrics from the database
 */
async function fetchWhaleMetrics(): Promise<WhaleMetrics[]> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Fetch balances
  const { data: balances } = await supabase
    .from('whale_balances')
    .select('address, chain, balance_usd, last_activity_ts');

  // Fetch recent transfers
  const { data: transfers } = await supabase
    .from('whale_transfers')
    .select('from_address, to_address, amount_usd, to_entity, timestamp')
    .gte('timestamp', yesterday.toISOString());

  if (!balances || !transfers) return [];

  // Aggregate metrics per whale
  const metrics: WhaleMetrics[] = balances.map(whale => {
    const whaleTransfers = transfers.filter(
      t => t.from_address === whale.address || t.to_address === whale.address
    );

    const transferVolume = whaleTransfers.reduce((sum, t) => sum + (parseFloat(t.amount_usd as any) || 0), 0);
    const avgTransferSize = whaleTransfers.length > 0 ? transferVolume / whaleTransfers.length : 0;
    
    const uniqueCounterparties = new Set(
      whaleTransfers.map(t => 
        t.from_address === whale.address ? t.to_address : t.from_address
      )
    ).size;

    const cexTransfers = whaleTransfers.filter(t => t.to_entity && ['binance', 'coinbase', 'kraken', 'okx'].includes(t.to_entity.toLowerCase()));
    const cexRatio = whaleTransfers.length > 0 ? cexTransfers.length / whaleTransfers.length : 0;

    return {
      address: whale.address,
      chain: whale.chain,
      balance_usd: parseFloat(whale.balance_usd as any) || 0,
      transfer_count_24h: whaleTransfers.length,
      transfer_volume_24h: transferVolume,
      avg_transfer_size: avgTransferSize,
      unique_counterparties: uniqueCounterparties,
      cex_interaction_ratio: cexRatio,
      last_activity_timestamp: whale.last_activity_ts || now.toISOString()
    };
  });

  return metrics;
}

/**
 * Fetch historical baseline data (30 days)
 */
async function fetchHistoricalBaseline() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data: historicalTransfers } = await supabase
    .from('whale_transfers')
    .select('amount_usd, timestamp, from_address, to_address')
    .gte('timestamp', thirtyDaysAgo.toISOString());

  if (!historicalTransfers) return null;

  // Group by day
  const dailyMetrics: Record<string, any> = {};
  
  historicalTransfers.forEach(transfer => {
    const date = new Date(transfer.timestamp).toISOString().split('T')[0];
    
    if (!dailyMetrics[date]) {
      dailyMetrics[date] = {
        volume: 0,
        count: 0,
        uniqueWhales: new Set()
      };
    }
    
    dailyMetrics[date].volume += parseFloat(transfer.amount_usd as any) || 0;
    dailyMetrics[date].count += 1;
    dailyMetrics[date].uniqueWhales.add(transfer.from_address);
    dailyMetrics[date].uniqueWhales.add(transfer.to_address);
  });

  return {
    dailyVolumes: Object.values(dailyMetrics).map((m: any) => m.volume),
    dailyCounts: Object.values(dailyMetrics).map((m: any) => m.count),
    dailyActiveWhales: Object.values(dailyMetrics).map((m: any) => m.uniqueWhales.size)
  };
}

// ============================================================================
// Anomaly Detection Algorithms
// ============================================================================

/**
 * Detect volume spikes using statistical methods
 */
async function detectVolumeSpike(
  currentMetrics: WhaleMetrics[],
  historical: any
): Promise<AnomalyResult | null> {
  if (!historical) return null;

  const currentVolume = currentMetrics.reduce((sum, m) => sum + m.transfer_volume_24h, 0);
  const baseline = calculateBaseline(historical.dailyVolumes);
  const zScore = calculateZScore(currentVolume, baseline.mean, baseline.stdDev);

  // Detect spike if z-score > 3 (99.7% threshold)
  if (Math.abs(zScore) > 3) {
    const severity = Math.abs(zScore) > 5 ? 'critical' : Math.abs(zScore) > 4 ? 'high' : 'medium';
    const confidence = Math.min(0.99, 0.7 + (Math.abs(zScore) - 3) * 0.1);

    return {
      anomalyId: `vol-spike-${Date.now()}`,
      severity,
      confidence,
      type: 'volume_spike',
      description: `Unusual trading volume detected: ${(currentVolume / 1e6).toFixed(2)}M USD (${zScore.toFixed(2)}σ above normal)`,
      affectedWhales: currentMetrics
        .filter(m => m.transfer_volume_24h > baseline.mean * 2)
        .map(m => m.address)
        .slice(0, 10),
      metrics: {
        currentVolume,
        baselineMean: baseline.mean,
        zScore,
        deviation: ((currentVolume - baseline.mean) / baseline.mean) * 100
      },
      timestamp: new Date().toISOString(),
      suggestedActions: [
        'Monitor for potential market movement',
        'Check if spike is coordinated across multiple whales',
        'Review recent news and events',
        severity === 'critical' ? 'Consider risk mitigation strategies' : ''
      ].filter(Boolean)
    };
  }

  return null;
}

/**
 * Detect dormant whale activation
 */
async function detectDormantActivation(
  currentMetrics: WhaleMetrics[]
): Promise<AnomalyResult[]> {
  const anomalies: AnomalyResult[] = [];
  const dormancyThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days

  for (const whale of currentMetrics) {
    if (whale.transfer_count_24h === 0) continue;

    const lastActivity = new Date(whale.last_activity_timestamp);
    const dormantPeriod = Date.now() - lastActivity.getTime();

    if (dormantPeriod > dormancyThreshold && whale.balance_usd > 1000000) {
      const dormantDays = Math.floor(dormantPeriod / (24 * 60 * 60 * 1000));
      const severity = dormantDays > 90 ? 'high' : dormantDays > 60 ? 'medium' : 'low';

      anomalies.push({
        anomalyId: `dormant-${whale.address}-${Date.now()}`,
        severity,
        confidence: 0.85,
        type: 'dormant_activation',
        description: `Dormant whale reactivated after ${dormantDays} days with ${whale.transfer_count_24h} transactions`,
        affectedWhales: [whale.address],
        metrics: {
          dormantDays,
          currentBalance: whale.balance_usd,
          transferCount: whale.transfer_count_24h,
          transferVolume: whale.transfer_volume_24h
        },
        timestamp: new Date().toISOString(),
        suggestedActions: [
          'Track subsequent whale movements',
          'Analyze transfer destinations',
          severity === 'high' ? 'High-value dormant activation - increase monitoring' : 'Monitor for accumulation or distribution'
        ].filter(Boolean)
      });
    }
  }

  return anomalies;
}

/**
 * Detect coordinated whale movements
 */
async function detectCoordinatedMovement(
  currentMetrics: WhaleMetrics[]
): Promise<AnomalyResult | null> {
  // Detect if multiple whales are moving assets to similar destinations
  const activeWhales = currentMetrics.filter(m => m.transfer_count_24h > 0);
  
  if (activeWhales.length < 3) return null;

  // Check for CEX concentration
  const cexWhales = activeWhales.filter(m => m.cex_interaction_ratio > 0.5);
  
  if (cexWhales.length >= 5) {
    const totalVolume = cexWhales.reduce((sum, m) => sum + m.transfer_volume_24h, 0);
    const avgCexRatio = cexWhales.reduce((sum, m) => sum + m.cex_interaction_ratio, 0) / cexWhales.length;

    return {
      anomalyId: `coord-${Date.now()}`,
      severity: cexWhales.length > 10 ? 'critical' : 'high',
      confidence: 0.75 + (cexWhales.length * 0.02),
      type: 'coordinated_movement',
      description: `${cexWhales.length} whales showing coordinated CEX transfers (${(avgCexRatio * 100).toFixed(1)}% avg ratio)`,
      affectedWhales: cexWhales.map(w => w.address).slice(0, 15),
      metrics: {
        coordinatedWhales: cexWhales.length,
        totalVolume,
        avgCexRatio,
        maxCexRatio: Math.max(...cexWhales.map(w => w.cex_interaction_ratio))
      },
      timestamp: new Date().toISOString(),
      suggestedActions: [
        'Possible coordinated sell-off detected',
        'Monitor order books on major exchanges',
        'Check for market maker activity',
        'Review social sentiment and news'
      ]
    };
  }

  return null;
}

/**
 * Detect velocity anomalies (rapid succession of transfers)
 */
async function detectVelocityAnomaly(
  currentMetrics: WhaleMetrics[],
  historical: any
): Promise<AnomalyResult[]> {
  if (!historical) return [];

  const anomalies: AnomalyResult[] = [];
  const baseline = calculateBaseline(historical.dailyCounts);

  for (const whale of currentMetrics) {
    if (whale.transfer_count_24h === 0) continue;

    const zScore = calculateZScore(whale.transfer_count_24h, baseline.mean, baseline.stdDev);

    if (zScore > 3) {
      const severity = zScore > 5 ? 'critical' : zScore > 4 ? 'high' : 'medium';

      anomalies.push({
        anomalyId: `velocity-${whale.address}-${Date.now()}`,
        severity,
        confidence: 0.8,
        type: 'velocity_anomaly',
        description: `Unusual transfer velocity: ${whale.transfer_count_24h} transactions in 24h (${zScore.toFixed(2)}σ)`,
        affectedWhales: [whale.address],
        metrics: {
          transferCount: whale.transfer_count_24h,
          baselineAvg: baseline.mean,
          zScore,
          avgTransferSize: whale.avg_transfer_size
        },
        timestamp: new Date().toISOString(),
        suggestedActions: [
          'Check for automated trading patterns',
          'Monitor for potential arbitrage activity',
          'Verify wallet security (possible compromise)'
        ]
      });
    }
  }

  return anomalies;
}

/**
 * Detect balance deviations using multivariate analysis
 */
async function detectBalanceDeviation(
  currentMetrics: WhaleMetrics[]
): Promise<AnomalyResult[]> {
  if (currentMetrics.length < 10) return [];

  const anomalies: AnomalyResult[] = [];
  
  // Create feature vectors: [balance, transfer_volume, unique_counterparties]
  const features = currentMetrics.map(m => [
    m.balance_usd,
    m.transfer_volume_24h,
    m.unique_counterparties
  ]);

  // Calculate isolation scores
  for (let i = 0; i < currentMetrics.length; i++) {
    const isolationScore = calculateIsolationScore(features[i], features);
    
    // If isolation score > 0.6, it's an anomaly
    if (isolationScore > 0.6) {
      anomalies.push({
        anomalyId: `balance-dev-${currentMetrics[i].address}-${Date.now()}`,
        severity: isolationScore > 0.8 ? 'high' : 'medium',
        confidence: isolationScore,
        type: 'balance_deviation',
        description: `Unusual balance/activity pattern detected for whale`,
        affectedWhales: [currentMetrics[i].address],
        metrics: {
          balance: currentMetrics[i].balance_usd,
          transferVolume: currentMetrics[i].transfer_volume_24h,
          counterparties: currentMetrics[i].unique_counterparties,
          isolationScore
        },
        timestamp: new Date().toISOString(),
        suggestedActions: [
          'Review whale activity profile',
          'Compare with historical patterns',
          'Check for unusual counterparty relationships'
        ]
      });
    }
  }

  return anomalies;
}

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Run comprehensive anomaly detection
 */
export async function detectAnomalies(): Promise<AnomalyResult[]> {
  try {
    console.log('🔍 Starting anomaly detection...');

    // Fetch data
    const [currentMetrics, historical] = await Promise.all([
      fetchWhaleMetrics(),
      fetchHistoricalBaseline()
    ]);

    if (currentMetrics.length === 0) {
      console.log('⚠️ No whale metrics available');
      return [];
    }

    // Run all detection algorithms in parallel
    const [
      volumeSpike,
      dormantActivations,
      coordinatedMovement,
      velocityAnomalies,
      balanceDeviations
    ] = await Promise.all([
      detectVolumeSpike(currentMetrics, historical),
      detectDormantActivation(currentMetrics),
      detectCoordinatedMovement(currentMetrics),
      detectVelocityAnomaly(currentMetrics, historical),
      detectBalanceDeviation(currentMetrics)
    ]);

    // Compile results
    const anomalies: AnomalyResult[] = [
      volumeSpike,
      coordinatedMovement,
      ...dormantActivations,
      ...velocityAnomalies,
      ...balanceDeviations
    ].filter((a): a is AnomalyResult => a !== null);

    console.log(`✅ Detected ${anomalies.length} anomalies`);

    // Persist anomalies to database
    if (anomalies.length > 0) {
      await persistAnomalies(anomalies);
    }

    return anomalies;
  } catch (error) {
    console.error('❌ Anomaly detection failed:', error);
    throw error;
  }
}

/**
 * Persist detected anomalies to the database
 */
async function persistAnomalies(anomalies: AnomalyResult[]): Promise<void> {
  try {
    const records = anomalies.map(anomaly => ({
      anomaly_id: anomaly.anomalyId,
      severity: anomaly.severity,
      confidence: anomaly.confidence,
      type: anomaly.type,
      description: anomaly.description,
      affected_whales: anomaly.affectedWhales,
      metrics: anomaly.metrics,
      suggested_actions: anomaly.suggestedActions,
      timestamp: anomaly.timestamp,
      resolved: false
    }));

    const { error } = await supabase
      .from('anomaly_detections')
      .insert(records);

    if (error) {
      console.error('Failed to persist anomalies:', error);
    } else {
      console.log(`💾 Persisted ${anomalies.length} anomalies to database`);
    }
  } catch (error) {
    console.error('Error persisting anomalies:', error);
  }
}

/**
 * Get recent anomalies from database
 */
export async function getRecentAnomalies(limit: number = 50): Promise<AnomalyResult[]> {
  try {
    const { data, error } = await supabase
      .from('anomaly_detections')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(record => ({
      anomalyId: record.anomaly_id,
      severity: record.severity,
      confidence: record.confidence,
      type: record.type,
      description: record.description,
      affectedWhales: record.affected_whales,
      metrics: record.metrics,
      suggestedActions: record.suggested_actions,
      timestamp: record.timestamp
    }));
  } catch (error) {
    console.error('Failed to fetch anomalies:', error);
    return [];
  }
}

/**
 * Mark anomaly as resolved
 */
export async function resolveAnomaly(anomalyId: string): Promise<void> {
  await supabase
    .from('anomaly_detections')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('anomaly_id', anomalyId);
}

