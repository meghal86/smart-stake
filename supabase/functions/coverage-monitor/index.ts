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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { window = '24h' } = await req.json().catch(() => ({}));

    // Calculate coverage metrics for each chain
    const coverageMetrics = await calculateCoverageMetrics(supabase, window);
    
    // Calculate overall system health
    const systemHealth = calculateSystemHealth(coverageMetrics);
    
    // Get API performance metrics
    const apiPerformance = await getApiPerformanceMetrics(supabase);

    const response = {
      coverage: coverageMetrics,
      systemHealth,
      apiPerformance,
      timestamp: new Date().toISOString(),
      window
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Coverage monitoring error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateCoverageMetrics(supabase: any, window: string) {
  const windowHours = window === '24h' ? 24 : window === '7d' ? 168 : 720;
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  // Get chain features data
  const { data: chainFeatures } = await supabase
    .from('chain_features_24h')
    .select('*');

  const coverageByChain = [];

  for (const chain of (chainFeatures || [])) {
    // Calculate coverage percentage based on thresholds
    const coverage = calculateChainCoverage(chain);
    
    // Get quality score
    const qualityScore = calculateQualityScore(chain);
    
    // Check for data gaps
    const dataGaps = await checkDataGaps(supabase, chain.chain, since);

    coverageByChain.push({
      chain: chain.chain,
      whaleCount: chain.whale_count,
      txCount: chain.tx_count,
      volume24h: Math.abs(chain.net_flow),
      coverage: coverage.percentage,
      coverageStatus: coverage.status,
      qualityScore,
      dataGaps,
      lastUpdate: chain.refreshed_at,
      issues: identifyIssues(chain, coverage, qualityScore, dataGaps)
    });
  }

  return coverageByChain;
}

function calculateChainCoverage(chainData: any) {
  const { whale_count, tx_count, net_flow } = chainData;
  const volume = Math.abs(net_flow || 0);

  // Coverage thresholds
  const thresholds = {
    whales: { excellent: 10, good: 5, fair: 3, poor: 1 },
    transactions: { excellent: 100, good: 50, fair: 25, poor: 10 },
    volume: { excellent: 10000000, good: 5000000, fair: 1000000, poor: 500000 }
  };

  // Calculate individual scores
  const whaleScore = getThresholdScore(whale_count, thresholds.whales);
  const txScore = getThresholdScore(tx_count, thresholds.transactions);
  const volumeScore = getThresholdScore(volume, thresholds.volume);

  // Weighted average (whales 40%, transactions 35%, volume 25%)
  const percentage = Math.round(whaleScore * 0.4 + txScore * 0.35 + volumeScore * 0.25);

  let status = 'poor';
  if (percentage >= 90) status = 'excellent';
  else if (percentage >= 75) status = 'good';
  else if (percentage >= 50) status = 'fair';

  return { percentage, status };
}

function getThresholdScore(value: number, thresholds: any): number {
  if (value >= thresholds.excellent) return 100;
  if (value >= thresholds.good) return 80;
  if (value >= thresholds.fair) return 60;
  if (value >= thresholds.poor) return 40;
  return 20;
}

function calculateQualityScore(chainData: any): number {
  const { whale_count, tx_count, net_flow } = chainData;
  
  // Quality factors
  let score = 50; // Base score
  
  // Whale diversity bonus
  if (whale_count >= 10) score += 20;
  else if (whale_count >= 5) score += 10;
  else if (whale_count >= 3) score += 5;
  
  // Transaction activity bonus
  if (tx_count >= 100) score += 15;
  else if (tx_count >= 50) score += 10;
  else if (tx_count >= 25) score += 5;
  
  // Volume significance bonus
  const volume = Math.abs(net_flow || 0);
  if (volume >= 10000000) score += 15;
  else if (volume >= 5000000) score += 10;
  else if (volume >= 1000000) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

async function checkDataGaps(supabase: any, chain: string, since: string) {
  // Check for missing hourly data points
  const { data: hourlyData } = await supabase
    .from('cluster_chain_correlation_hourly')
    .select('hour')
    .eq('chain', chain)
    .gte('hour', since)
    .order('hour', { ascending: true });

  if (!hourlyData?.length) {
    return { hasGaps: true, gapCount: 24, description: 'No hourly data available' };
  }

  // Calculate expected vs actual data points
  const hoursExpected = Math.floor((Date.now() - new Date(since).getTime()) / (60 * 60 * 1000));
  const hoursActual = hourlyData.length;
  const gapCount = Math.max(0, hoursExpected - hoursActual);
  
  return {
    hasGaps: gapCount > 0,
    gapCount,
    description: gapCount > 0 ? `Missing ${gapCount} hourly data points` : 'Complete data coverage'
  };
}

function identifyIssues(chainData: any, coverage: any, qualityScore: number, dataGaps: any) {
  const issues = [];
  
  if (coverage.percentage < 50) {
    issues.push({
      type: 'low_coverage',
      severity: 'high',
      message: `Coverage below 50% (${coverage.percentage}%)`
    });
  }
  
  if (qualityScore < 60) {
    issues.push({
      type: 'low_quality',
      severity: 'medium',
      message: `Quality score below 60 (${qualityScore})`
    });
  }
  
  if (chainData.whale_count < 3) {
    issues.push({
      type: 'insufficient_whales',
      severity: 'high',
      message: `Only ${chainData.whale_count} whales tracked (minimum 3 required)`
    });
  }
  
  if (dataGaps.hasGaps && dataGaps.gapCount > 6) {
    issues.push({
      type: 'data_gaps',
      severity: 'medium',
      message: `${dataGaps.gapCount} missing data points`
    });
  }
  
  return issues;
}

function calculateSystemHealth(coverageMetrics: any[]) {
  if (!coverageMetrics.length) {
    return {
      overall: 'critical',
      score: 0,
      summary: 'No coverage data available'
    };
  }

  const avgCoverage = coverageMetrics.reduce((sum, chain) => sum + chain.coverage, 0) / coverageMetrics.length;
  const avgQuality = coverageMetrics.reduce((sum, chain) => sum + chain.qualityScore, 0) / coverageMetrics.length;
  const chainsWithIssues = coverageMetrics.filter(chain => chain.issues.length > 0).length;
  
  // Overall health score (coverage 50%, quality 30%, issues 20%)
  const issuesPenalty = (chainsWithIssues / coverageMetrics.length) * 100;
  const healthScore = Math.round(avgCoverage * 0.5 + avgQuality * 0.3 + (100 - issuesPenalty) * 0.2);
  
  let overall = 'critical';
  if (healthScore >= 90) overall = 'excellent';
  else if (healthScore >= 75) overall = 'good';
  else if (healthScore >= 60) overall = 'fair';
  else if (healthScore >= 40) overall = 'poor';
  
  return {
    overall,
    score: healthScore,
    avgCoverage: Math.round(avgCoverage),
    avgQuality: Math.round(avgQuality),
    chainsWithIssues,
    totalChains: coverageMetrics.length,
    summary: `${Math.round(avgCoverage)}% coverage, ${chainsWithIssues}/${coverageMetrics.length} chains with issues`
  };
}

async function getApiPerformanceMetrics(supabase: any) {
  const { data: performanceData } = await supabase
    .from('api_performance_metrics')
    .select('endpoint, response_time_ms, cache_hit, error_count')
    .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
    .order('timestamp', { ascending: false })
    .limit(100);

  if (!performanceData?.length) {
    return { p95ResponseTime: 0, cacheHitRate: 0, errorRate: 0 };
  }

  // Calculate P95 response time
  const responseTimes = performanceData.map(d => d.response_time_ms).sort((a, b) => a - b);
  const p95Index = Math.floor(responseTimes.length * 0.95);
  const p95ResponseTime = responseTimes[p95Index] || 0;

  // Calculate cache hit rate
  const cacheHits = performanceData.filter(d => d.cache_hit).length;
  const cacheHitRate = Math.round((cacheHits / performanceData.length) * 100);

  // Calculate error rate
  const totalErrors = performanceData.reduce((sum, d) => sum + d.error_count, 0);
  const errorRate = Math.round((totalErrors / performanceData.length) * 100);

  return {
    p95ResponseTime,
    cacheHitRate,
    errorRate,
    totalRequests: performanceData.length
  };
}