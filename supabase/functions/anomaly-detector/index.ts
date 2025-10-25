/**
 * Anomaly Detector Edge Function
 * Runs periodically via cron to detect whale behavior anomalies
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Statistical helper functions
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

function calculateBaseline(values: number[]) {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0, median: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const median = n % 2 === 0 
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 
    : sorted[Math.floor(n / 2)];

  return { mean, stdDev, median };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Starting anomaly detection...');

    // Fetch current whale metrics
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: balances } = await supabase
      .from('whale_balances')
      .select('address, chain, balance_usd, last_activity_ts');

    const { data: transfers } = await supabase
      .from('whale_transfers')
      .select('from_address, to_address, amount_usd, to_entity, timestamp')
      .gte('timestamp', yesterday.toISOString());

    if (!balances || !transfers) {
      throw new Error('Failed to fetch whale data');
    }

    // Fetch historical baseline (30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: historicalTransfers } = await supabase
      .from('whale_transfers')
      .select('amount_usd, timestamp')
      .gte('timestamp', thirtyDaysAgo.toISOString());

    // Calculate daily volumes for baseline
    const dailyMetrics: Record<string, { volume: number; count: number }> = {};
    
    (historicalTransfers || []).forEach(transfer => {
      const date = new Date(transfer.timestamp).toISOString().split('T')[0];
      if (!dailyMetrics[date]) {
        dailyMetrics[date] = { volume: 0, count: 0 };
      }
      dailyMetrics[date].volume += parseFloat(transfer.amount_usd as any) || 0;
      dailyMetrics[date].count += 1;
    });

    const dailyVolumes = Object.values(dailyMetrics).map(m => m.volume);
    const dailyCounts = Object.values(dailyMetrics).map(m => m.count);

    // Aggregate current metrics
    const currentVolume = transfers.reduce((sum, t) => sum + (parseFloat(t.amount_usd as any) || 0), 0);
    const currentCount = transfers.length;

    const anomalies: any[] = [];

    // 1. Detect Volume Spike
    const volumeBaseline = calculateBaseline(dailyVolumes);
    const volumeZScore = calculateZScore(currentVolume, volumeBaseline.mean, volumeBaseline.stdDev);

    if (Math.abs(volumeZScore) > 3) {
      const severity = Math.abs(volumeZScore) > 5 ? 'critical' : Math.abs(volumeZScore) > 4 ? 'high' : 'medium';
      
      anomalies.push({
        anomaly_id: `vol-spike-${Date.now()}`,
        severity,
        confidence: Math.min(0.99, 0.7 + (Math.abs(volumeZScore) - 3) * 0.1),
        type: 'volume_spike',
        description: `Unusual trading volume: ${(currentVolume / 1e6).toFixed(2)}M USD (${volumeZScore.toFixed(2)}σ above normal)`,
        affected_whales: balances.slice(0, 10).map(b => b.address),
        metrics: {
          currentVolume,
          baselineMean: volumeBaseline.mean,
          zScore: volumeZScore,
          deviation: ((currentVolume - volumeBaseline.mean) / volumeBaseline.mean) * 100
        },
        suggested_actions: [
          'Monitor for potential market movement',
          'Check if spike is coordinated across multiple whales',
          'Review recent news and events'
        ],
        timestamp: now.toISOString()
      });
    }

    // 2. Detect Coordinated Movement (CEX concentration)
    const whalesWithTransfers = new Map<string, any>();
    
    transfers.forEach(transfer => {
      if (!whalesWithTransfers.has(transfer.from_address)) {
        whalesWithTransfers.set(transfer.from_address, {
          address: transfer.from_address,
          transfers: [],
          cexCount: 0
        });
      }
      
      const whale = whalesWithTransfers.get(transfer.from_address);
      whale.transfers.push(transfer);
      
      if (transfer.to_entity && ['binance', 'coinbase', 'kraken', 'okx'].includes(transfer.to_entity.toLowerCase())) {
        whale.cexCount++;
      }
    });

    const cexWhales = Array.from(whalesWithTransfers.values())
      .filter(w => w.transfers.length > 0 && (w.cexCount / w.transfers.length) > 0.5);

    if (cexWhales.length >= 5) {
      const totalCexVolume = cexWhales.reduce((sum, w) => 
        sum + w.transfers.reduce((s: number, t: any) => s + (parseFloat(t.amount_usd) || 0), 0), 0
      );

      anomalies.push({
        anomaly_id: `coord-${Date.now()}`,
        severity: cexWhales.length > 10 ? 'critical' : 'high',
        confidence: 0.75 + (cexWhales.length * 0.02),
        type: 'coordinated_movement',
        description: `${cexWhales.length} whales showing coordinated CEX transfers`,
        affected_whales: cexWhales.map(w => w.address).slice(0, 15),
        metrics: {
          coordinatedWhales: cexWhales.length,
          totalVolume: totalCexVolume
        },
        suggested_actions: [
          'Possible coordinated sell-off detected',
          'Monitor order books on major exchanges',
          'Review social sentiment and news'
        ],
        timestamp: now.toISOString()
      });
    }

    // 3. Detect Dormant Whale Activation
    const dormancyThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    for (const whale of balances) {
      const whaleTransferCount = transfers.filter(
        t => t.from_address === whale.address || t.to_address === whale.address
      ).length;

      if (whaleTransferCount === 0) continue;

      const lastActivity = whale.last_activity_ts ? new Date(whale.last_activity_ts) : new Date(0);
      const dormantPeriod = now.getTime() - lastActivity.getTime();

      if (dormantPeriod > dormancyThreshold && parseFloat(whale.balance_usd as any) > 1000000) {
        const dormantDays = Math.floor(dormantPeriod / (24 * 60 * 60 * 1000));
        const severity = dormantDays > 90 ? 'high' : dormantDays > 60 ? 'medium' : 'low';

        anomalies.push({
          anomaly_id: `dormant-${whale.address}-${Date.now()}`,
          severity,
          confidence: 0.85,
          type: 'dormant_activation',
          description: `Dormant whale reactivated after ${dormantDays} days`,
          affected_whales: [whale.address],
          metrics: {
            dormantDays,
            currentBalance: parseFloat(whale.balance_usd as any),
            transferCount: whaleTransferCount
          },
          suggested_actions: [
            'Track subsequent whale movements',
            'Analyze transfer destinations'
          ],
          timestamp: now.toISOString()
        });
      }
    }

    // 4. Detect Velocity Anomaly
    const countBaseline = calculateBaseline(dailyCounts);
    const countZScore = calculateZScore(currentCount, countBaseline.mean, countBaseline.stdDev);

    if (countZScore > 3) {
      const severity = countZScore > 5 ? 'critical' : countZScore > 4 ? 'high' : 'medium';

      anomalies.push({
        anomaly_id: `velocity-${Date.now()}`,
        severity,
        confidence: 0.8,
        type: 'velocity_anomaly',
        description: `Unusual transfer velocity: ${currentCount} transactions in 24h (${countZScore.toFixed(2)}σ)`,
        affected_whales: Array.from(whalesWithTransfers.keys()).slice(0, 10),
        metrics: {
          transferCount: currentCount,
          baselineAvg: countBaseline.mean,
          zScore: countZScore
        },
        suggested_actions: [
          'Check for automated trading patterns',
          'Monitor for potential arbitrage activity'
        ],
        timestamp: now.toISOString()
      });
    }

    // Persist anomalies to database
    if (anomalies.length > 0) {
      const { error } = await supabase
        .from('anomaly_detections')
        .insert(anomalies);

      if (error) {
        console.error('Failed to persist anomalies:', error);
        throw error;
      }

      console.log(`✅ Detected and persisted ${anomalies.length} anomalies`);
    } else {
      console.log('✅ No anomalies detected - all patterns normal');
    }

    return new Response(
      JSON.stringify({
        success: true,
        anomaliesDetected: anomalies.length,
        anomalies: anomalies.map(a => ({
          type: a.type,
          severity: a.severity,
          confidence: a.confidence
        })),
        timestamp: now.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Anomaly detection failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

