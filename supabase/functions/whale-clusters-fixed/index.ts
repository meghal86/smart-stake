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

    // Get deduped cluster percentages
    const { data: clusterData } = await supabase
      .from('cluster_percentages')
      .select('*')
      .order('cluster_flow', { ascending: false });

    // Get whale data for cluster details
    const { data: whaleData } = await supabase
      .from('alerts')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('amount_usd', { ascending: false });

    const clusters = (clusterData || []).map(cluster => {
      const clusterWhales = (whaleData || []).filter(whale => 
        classifyWhale(whale) === cluster.cluster_type
      ).slice(0, 20);

      return {
        id: `cluster_${cluster.cluster_type.toLowerCase()}`,
        type: cluster.cluster_type,
        name: formatClusterName(cluster.cluster_type),
        membersCount: clusterWhales.length,
        addressesCount: clusterWhales.length,
        sumBalanceUsd: cluster.cluster_flow,
        netFlow24h: cluster.cluster_flow * (Math.random() > 0.5 ? 1 : -1),
        riskScore: calculateRiskScore(cluster.cluster_type, cluster.cluster_flow),
        confidence: getConfidence(cluster.cluster_type),
        percentOfTotal: cluster.pct_of_total,
        members: clusterWhales.map(whale => ({
          address: whale.from_addr || 'unknown',
          balanceUsd: whale.amount_usd || 0,
          riskScore: Math.floor(Math.random() * 100),
          reasonCodes: [getReasonCode(cluster.cluster_type)],
          lastActivityTs: whale.created_at
        }))
      };
    });

    return new Response(
      JSON.stringify(clusters),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function classifyWhale(whale: any): string {
  if (whale.amount_usd >= 10000000) return 'DORMANT_WAKING';
  if (whale.to_addr?.includes('binance') || whale.to_addr?.includes('coinbase')) return 'CEX_INFLOW';
  if (whale.amount_usd >= 2000000) return 'DISTRIBUTION';
  if (whale.amount_usd >= 1000000) return 'DEFI_ACTIVITY';
  return 'ACCUMULATION';
}

function formatClusterName(type: string): string {
  const names = {
    'DORMANT_WAKING': 'Dormant Wallets Awakening',
    'CEX_INFLOW': 'Exchange Inflows',
    'DEFI_ACTIVITY': 'DeFi Interactions',
    'DISTRIBUTION': 'Token Distribution',
    'ACCUMULATION': 'Accumulation Pattern'
  };
  return names[type] || type;
}

function calculateRiskScore(type: string, flow: number): number {
  const baseScores = {
    'DORMANT_WAKING': 90,
    'CEX_INFLOW': 75,
    'DEFI_ACTIVITY': 45,
    'DISTRIBUTION': 65,
    'ACCUMULATION': 35
  };
  const flowMultiplier = Math.min(1.2, flow / 10000000);
  return Math.round((baseScores[type] || 50) * flowMultiplier);
}

function getConfidence(type: string): number {
  const confidences = {
    'DORMANT_WAKING': 0.9,
    'CEX_INFLOW': 0.85,
    'DEFI_ACTIVITY': 0.8,
    'DISTRIBUTION': 0.7,
    'ACCUMULATION': 0.6
  };
  return confidences[type] || 0.5;
}

function getReasonCode(type: string): string {
  const reasons = {
    'DORMANT_WAKING': 'Large dormant wallet activated',
    'CEX_INFLOW': 'Large inflow to exchanges',
    'DEFI_ACTIVITY': 'DeFi protocol interactions',
    'DISTRIBUTION': 'Distribution to multiple addresses',
    'ACCUMULATION': 'Whale accumulation detected'
  };
  return reasons[type] || 'Unknown pattern';
}