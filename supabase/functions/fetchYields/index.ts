import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch yield data from DeFiLlama
    const defiLlamaUrl = 'https://yields.llama.fi/pools';
    const response = await fetch(defiLlamaUrl);
    const data = await response.json();

    if (!data || !data.data) {
      throw new Error('Failed to fetch from DeFiLlama');
    }

    // Process top yield opportunities
    const topYields = data.data
      .filter((pool: any) => 
        pool.apy && 
        pool.tvlUsd > 1000000 && // Min $1M TVL
        pool.apy > 5 && // Min 5% APY
        pool.apy < 100 // Max 100% APY (filter out suspicious yields)
      )
      .sort((a: any, b: any) => b.apy - a.apy)
      .slice(0, 50); // Top 50 yields

    // Calculate risk scores based on various factors
    const yieldsWithRisk = topYields.map((pool: any) => {
      let riskScore = 0;
      
      // TVL risk (higher TVL = lower risk)
      if (pool.tvlUsd < 10000000) riskScore += 3; // <$10M
      else if (pool.tvlUsd < 100000000) riskScore += 2; // <$100M
      else riskScore += 1; // >$100M
      
      // APY risk (higher APY = higher risk)
      if (pool.apy > 50) riskScore += 4;
      else if (pool.apy > 25) riskScore += 3;
      else if (pool.apy > 15) riskScore += 2;
      else riskScore += 1;
      
      // Audit risk (if available)
      if (!pool.audits || pool.audits.length === 0) riskScore += 2;
      
      // Normalize to 1-10 scale
      const normalizedRisk = Math.min(10, Math.max(1, riskScore));
      
      return {
        ...pool,
        risk_score: normalizedRisk
      };
    });

    // Update or insert yield data
    for (const yieldData of yieldsWithRisk) {
      const { error } = await supabaseClient
        .from('yields')
        .upsert({
          protocol: yieldData.project || 'Unknown',
          chain: yieldData.chain || 'ethereum',
          apy: yieldData.apy,
          tvl_usd: yieldData.tvlUsd,
          risk_score: yieldData.risk_score
        }, {
          onConflict: 'protocol,chain'
        });

      if (error) {
        console.error('Error upserting yield:', error);
      }
    }

    // Create alerts for new high-yield opportunities
    const highYieldThreshold = 20; // 20% APY
    const newHighYields = yieldsWithRisk.filter((y: any) => 
      y.apy > highYieldThreshold && y.risk_score <= 5
    );

    for (const highYield of newHighYields.slice(0, 5)) {
      const { error } = await supabaseClient
        .from('alerts')
        .insert({
          to_addr: 'DeFi Protocol',
          from_addr: 'Yield Alert',
          tx_hash: `yield-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          token: highYield.symbol || 'Unknown',
          chain: highYield.chain || 'ethereum',
          amount_usd: highYield.tvlUsd || 0
        });

      if (error) {
        console.error('Error inserting yield alert:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        yieldsProcessed: yieldsWithRisk.length,
        highYieldAlerts: newHighYields.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fetchYields:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});