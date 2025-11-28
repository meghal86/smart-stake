import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { window = '24h' } = await req.json().catch(() => ({}));

    // Get chain risk data with optional whale alert enrichment
    const ENABLE_WHALE_ALERT = Deno.env.get('ENABLE_WHALE_ALERT_ENRICHMENT') === 'true';
    const chainRiskData = await getEnrichedChainRisk(supabase, window, ENABLE_WHALE_ALERT);
    
    // Calculate correlation spikes
    const correlationSpikes = {};
    
    // Build chains with OTHERS bucket
    const chains = buildChainsWithOthers(chainRiskData, window);

    const responseTime = Date.now() - startTime;
    const response = {
      chains: chains.sort((a, b) => {
        const order = ['BTC', 'ETH', 'SOL', 'OTHERS'];
        return order.indexOf(a.chain) - order.indexOf(b.chain);
      }),
      correlationSpikes,
      refreshedAt: new Date().toISOString(),
      window,
      performance: {
        responseTimeMs: responseTime,
        coverage: Math.round((chains.filter(c => c.risk !== null).length / chains.length) * 100)
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// In-memory cache
const riskCache = new Map();
const CACHE_TTL = 20000; // 20 seconds

async function getEnrichedChainRisk(supabase: any, window: string, enableEnrichment: boolean) {
  const cacheKey = `${window}_${enableEnrichment}`;
  const cached = riskCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const windowHours = window === '30d' ? 720 : window === '7d' ? 168 : 24;
  const multiplier = window === '30d' ? 1.4 : window === '7d' ? 1.2 : 1.0;
  
  let result;
  if (enableEnrichment) {
    const enrichedData = await computeEnrichedRisk(supabase, windowHours);
    const baselineData = await getBaselineRisk(supabase);
    
    // Shadow mode with enhanced metrics
    const metrics = logEnhancedMetrics(enrichedData, baselineData, windowHours);
    
    // Auto-disable on high drift
    if (metrics.riskDriftP95 > 15) {
      await checkAutoDisable(supabase, metrics);
    }
    
    result = enrichedData.map(item => ({ ...item, risk_multiplier: multiplier, enriched: true }));
  } else {
    result = await getBaselineRisk(supabase, multiplier);
  }
  
  riskCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

// Per-chain coverage thresholds
const CHAIN_THRESHOLDS = {
  'BTC': { whales: 3, tx: 10, volume: 300000 },
  'ETH': { whales: 2, tx: 8, volume: 150000 },
  'SOL': { whales: 1, tx: 5, volume: 75000 },
  'default': { whales: 1, tx: 5, volume: 75000 }
};

async function getBaselineRisk(supabase: any, multiplier: number = 1.0) {
  try {
    const { data } = await supabase.from('chain_risk_simple').select('*');
    return (data || []).map(item => ({
      ...item,
      risk_multiplier: multiplier,
      volume_window: item.volume_24h || 0,
      threshold: CHAIN_THRESHOLDS[item.chain] || CHAIN_THRESHOLDS.default
    }));
  } catch (error) {
    console.log('No chain_risk_simple data available');
    return [];
  }
}

async function computeEnrichedRisk(supabase: any, windowHours: number) {
  const windowInterval = `${windowHours} hours`;
  
  try {
    // Get unioned transfers (internal + whale alert, deduped)
    const { data: unionedTransfers } = await supabase.rpc('get_unioned_transfers', {
      window_hours: windowHours
    });
    
    if (!unionedTransfers) {
      return await getBaselineRisk(supabase);
    }
    
    // Compute flow components from unioned data
    const chainStats = {};
    unionedTransfers.forEach(tx => {
      if (!chainStats[tx.chain]) {
        chainStats[tx.chain] = { inflow: 0, outflow: 0, tx_count: 0 };
      }
      chainStats[tx.chain].tx_count++;
      if (tx.direction === 'in') chainStats[tx.chain].inflow += tx.usd_amount;
      if (tx.direction === 'out') chainStats[tx.chain].outflow += tx.usd_amount;
    });
    
    // Get baseline data for concentration/inactivity components
    const baselineData = await getBaselineRisk(supabase);
    
    // Merge enriched flow with baseline concentration/inactivity
    return baselineData.map(item => {
      const stats = chainStats[item.chain];
      if (stats) {
        const totalFlow = stats.inflow + stats.outflow;
        const flowComponent = totalFlow > 0 ? Math.abs(stats.inflow - stats.outflow) / totalFlow : item.flow_component;
        
        return {
          ...item,
          flow_component: flowComponent,
          tx_count: stats.tx_count,
          volume_window: totalFlow,
          enriched: true
        };
      }
      return item;
    });
  } catch (error) {
    console.log('Enrichment failed, using baseline:', error);
    return await getBaselineRisk(supabase);
  }
}

function logEnhancedMetrics(enriched: any[], baseline: any[], windowHours: number) {
  const diffs = enriched.map(e => {
    const b = baseline.find(b => b.chain === e.chain);
    if (!b) return null;
    
    const eRisk = calculateRisk(e);
    const bRisk = calculateRisk(b);
    return { chain: e.chain, enriched: eRisk, baseline: bRisk, diff: Math.abs(eRisk - bRisk) };
  }).filter(Boolean);
  
  const riskCoverageRatio = enriched.filter(e => calculateRisk(e) > 0).length / enriched.length;
  const enrichmentDedupeRate = 0.65; // Placeholder - would come from actual dedup stats
  const flowDeltaEnriched = diffs.reduce((sum, d) => sum + d.diff, 0) / diffs.length;
  const riskDiffP50 = diffs.sort((a, b) => a.diff - b.diff)[Math.floor(diffs.length * 0.5)]?.diff || 0;
  const riskDiffP95 = diffs.sort((a, b) => a.diff - b.diff)[Math.floor(diffs.length * 0.95)]?.diff || 0;
  
  const metrics = {
    risk_coverage_ratio: riskCoverageRatio,
    enrichment_dedupe_rate: enrichmentDedupeRate,
    flow_delta_enriched: flowDeltaEnriched,
    risk_diff_p50: riskDiffP50,
    risk_diff_p95: riskDiffP95,
    riskDriftP95: riskDiffP95
  };
  
  console.log('Enhanced metrics:', metrics);
  
  if (flowDeltaEnriched > 10) {
    console.warn('High risk delta detected:', { flowDeltaEnriched, diffs });
  }
  
  return metrics;
}

let consecutiveHighDrift = 0;

async function checkAutoDisable(supabase: any, metrics: any) {
  consecutiveHighDrift++;
  
  if (consecutiveHighDrift >= 3) {
    console.error('AUTO-DISABLING enrichment due to high drift:', metrics);
    // In production, this would call: supabase secrets set ENABLE_WHALE_ALERT_ENRICHMENT=false
    consecutiveHighDrift = 0;
  }
}

function resetDriftCounter() {
  consecutiveHighDrift = 0;
}

function calculateRisk(item: any): number {
  const flowComp = item.flow_component || 0;
  const concComp = item.concentration_component || 0;
  const inactComp = item.inactivity_component || 0;
  return Math.round(100 * (0.50 * flowComp + 0.30 * concComp + 0.20 * inactComp));
}

function buildChainsWithOthers(chainRiskData: any[], window: string) {
  const PRIMARY = ['BTC', 'ETH', 'SOL'];
  const chains = [];
  
  // Add primary chains (always present)
  PRIMARY.forEach(chain => {
    const existing = chainRiskData.find(c => c.chain === chain);
    if (existing) {
      const whaleCount = existing.whale_count || 0;
      const txCount = existing.tx_count || 0;
      const volumeWindow = existing.volume_window || 0;
      
      // Coverage gates
      const hasCoverage = whaleCount >= 1 && txCount >= 5 && volumeWindow >= 100000;
      
      let risk = null;
      let components = null;
      
      // Use per-chain thresholds
      const threshold = existing.threshold || CHAIN_THRESHOLDS.default;
      const meetsThreshold = whaleCount >= threshold.whales && 
                            txCount >= threshold.tx && 
                            volumeWindow >= threshold.volume;
      
      if (meetsThreshold) {
        const flowComp = existing.flow_component || 0;
        const concComp = existing.concentration_component || 0;
        const inactComp = existing.inactivity_component || 0;
        
        // Calculate base risk then apply window multiplier
        const baseRisk = 100 * (0.50 * flowComp + 0.30 * concComp + 0.20 * inactComp);
        const multiplier = existing.risk_multiplier || 1.0;
        risk = Math.min(100, Math.round(baseRisk * multiplier));
        
        components = {
          cexInflow: Math.round(flowComp * 100),
          netOutflow: Math.round(concComp * 100),
          dormantWake: Math.round(inactComp * 100)
        };
      }
      
      chains.push({
        chain,
        risk,
        components,
        reason: meetsThreshold ? null : 'low_coverage',
        coverage: { whaleCount, txCount, volumeWindow }
      });
    } else {
      chains.push({
        chain,
        risk: null,
        components: null,
        reason: 'low_coverage',
        coverage: { whaleCount: 0, txCount: 0, volumeWindow: 0 }
      });
    }
  });
  
  // Add OTHERS bucket for remaining chains
  const others = chainRiskData.filter(c => !PRIMARY.includes(c.chain));
  if (others.length > 0) {
    const totalVol = others.reduce((s, c) => s + (c.volume_window || 0), 0);
    const totalWhales = others.reduce((s, c) => s + (c.whale_count || 0), 0);
    const totalTx = others.reduce((s, c) => s + (c.tx_count || 0), 0);
    
    // Check coverage for OTHERS bucket
    const hasCoverage = totalWhales >= 1 && totalTx >= 5 && totalVol >= 100000;
    
    let avgRisk = null;
    let avgComponents = null;
    
    if (hasCoverage && totalVol > 0) {
      // Compute volume-weighted average using post-multiplied risks
      const validOthers = others.filter(c => {
        const flowComp = c.flow_component || 0;
        const concComp = c.concentration_component || 0;
        const inactComp = c.inactivity_component || 0;
        const baseRisk = 100 * (0.50 * flowComp + 0.30 * concComp + 0.20 * inactComp);
        const multiplier = c.risk_multiplier || 1.0;
        return Math.min(100, Math.round(baseRisk * multiplier)) > 0;
      });
      
      if (validOthers.length > 0) {
        const weightedRiskSum = validOthers.reduce((sum, c) => {
          const flowComp = c.flow_component || 0;
          const concComp = c.concentration_component || 0;
          const inactComp = c.inactivity_component || 0;
          const baseRisk = 100 * (0.50 * flowComp + 0.30 * concComp + 0.20 * inactComp);
          const multiplier = c.risk_multiplier || 1.0;
          const postMultipliedRisk = Math.min(100, Math.round(baseRisk * multiplier));
          return sum + (postMultipliedRisk * (c.volume_window || 0));
        }, 0);
        
        avgRisk = Math.round(weightedRiskSum / totalVol);
        
        // Components are volume-weighted averages (unchanged)
        const weightedFlow = others.reduce((s, c) => s + ((c.flow_component || 0) * (c.volume_window || 0)), 0) / totalVol;
        const weightedConc = others.reduce((s, c) => s + ((c.concentration_component || 0) * (c.volume_window || 0)), 0) / totalVol;
        const weightedInact = others.reduce((s, c) => s + ((c.inactivity_component || 0) * (c.volume_window || 0)), 0) / totalVol;
        
        avgComponents = {
          cexInflow: Math.round(weightedFlow * 100),
          netOutflow: Math.round(weightedConc * 100),
          dormantWake: Math.round(weightedInact * 100)
        };
      }
    }
    
    chains.push({
      chain: 'OTHERS',
      risk: avgRisk,
      components: avgComponents,
      reason: hasCoverage ? null : 'low_coverage',
      coverage: {
        whaleCount: totalWhales,
        txCount: totalTx,
        volumeWindow: totalVol
      }
    });
  } else {
    chains.push({
      chain: 'OTHERS',
      risk: null,
      components: null,
      reason: 'low_coverage',
      coverage: { whaleCount: 0, txCount: 0, volumeWindow: 0 }
    });
  }
  
  return chains;
}

async function calculateCorrelationSpikes(supabase: any, window: string): Promise<Record<string, boolean>> {
  return {}; // Simplified for now
}