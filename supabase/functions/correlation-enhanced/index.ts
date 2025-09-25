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

    // Get correlation spikes and affected chains
    const { data: spikes } = await supabase
      .from('correlation_spikes_hourly')
      .select('*')
      .eq('is_spike', true)
      .gte('hour', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('hour', { ascending: false });

    // Calculate correlated chains for highlighting
    const correlatedChains = new Set<string>();
    const clusterSpikes: Record<string, any[]> = {};

    for (const spike of spikes || []) {
      if (spike.cluster_type === 'DORMANT_WAKING' || spike.cluster_type === 'CEX_INFLOW') {
        correlatedChains.add(spike.chain);
        
        if (!clusterSpikes[spike.cluster_type]) {
          clusterSpikes[spike.cluster_type] = [];
        }
        clusterSpikes[spike.cluster_type].push({
          chain: spike.chain,
          flow: spike.chain_flow,
          hour: spike.hour,
          threshold: spike.p85_threshold
        });
      }
    }

    // Get current chain risk for correlation analysis
    const { data: chainRisk } = await supabase
      .from('chain_risk_normalized')
      .select('chain, risk_score, concentration_risk, flow_risk, activity_risk')
      .is('reason', null);

    // Calculate correlation coefficients
    const correlations = await calculateChainCorrelations(supabase, Array.from(correlatedChains));

    const response = {
      correlatedChains: Array.from(correlatedChains),
      clusterSpikes,
      correlations,
      chainRiskData: chainRisk || [],
      spikeCount: spikes?.length || 0,
      window,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Correlation analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateChainCorrelations(supabase: any, chains: string[]) {
  if (chains.length < 2) return {};

  const correlations: Record<string, number> = {};

  // Get hourly flows for correlation calculation
  const { data: hourlyFlows } = await supabase
    .from('cluster_chain_correlation_hourly')
    .select('chain, hour, chain_flow')
    .in('chain', chains)
    .gte('hour', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('hour', { ascending: true });

  if (!hourlyFlows?.length) return {};

  // Group by chain
  const chainFlows: Record<string, number[]> = {};
  for (const flow of hourlyFlows) {
    if (!chainFlows[flow.chain]) {
      chainFlows[flow.chain] = [];
    }
    chainFlows[flow.chain].push(flow.chain_flow);
  }

  // Calculate pairwise correlations
  const chainList = Object.keys(chainFlows);
  for (let i = 0; i < chainList.length; i++) {
    for (let j = i + 1; j < chainList.length; j++) {
      const chain1 = chainList[i];
      const chain2 = chainList[j];
      
      const correlation = calculatePearsonCorrelation(
        chainFlows[chain1],
        chainFlows[chain2]
      );
      
      correlations[`${chain1}-${chain2}`] = correlation;
    }
  }

  return correlations;
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
  const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
  const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}