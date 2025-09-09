import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

class MarketImpactSimulator {
  private readonly LIQUIDITY_POOLS = {
    ethereum: { depth: 50000, slippage: 0.001 },
    polygon: { depth: 15000, slippage: 0.002 },
    bsc: { depth: 25000, slippage: 0.0015 },
    arbitrum: { depth: 20000, slippage: 0.0012 }
  };
  
  simulate(params: {
    whaleCount: number;
    transactionSize: number;
    timeframe: string;
    chain: string;
  }) {
    const { whaleCount, transactionSize, timeframe, chain } = params;
    const totalVolume = whaleCount * transactionSize;
    
    const liquidityPool = this.LIQUIDITY_POOLS[chain] || this.LIQUIDITY_POOLS.ethereum;
    const baseImpact = (totalVolume / liquidityPool.depth) * 100;
    
    const timeMultipliers = {
      '1h': 2.5,
      '6h': 1.8,
      '24h': 1.2,
      '7d': 0.8
    };
    
    const timeMultiplier = timeMultipliers[timeframe] || 1;
    const priceImpact = baseImpact * timeMultiplier;
    
    const liquidityDrain = Math.min(95, priceImpact * 15);
    const volumeSpike = Math.round(priceImpact * 25 + 100);
    const recoveryHours = Math.max(1, Math.round(priceImpact * 2));
    const cascadeRisk = priceImpact > 8 ? 'High' : priceImpact > 3 ? 'Medium' : 'Low';
    
    const currentPrice = 3000;
    const riskZones = [
      {
        price: `$${(currentPrice * (1 - priceImpact * 0.3 / 100)).toFixed(0)}`,
        impact: `${(priceImpact * 0.3).toFixed(1)}%`,
        probability: `${Math.max(20, 90 - priceImpact * 2).toFixed(0)}%`
      },
      {
        price: `$${(currentPrice * (1 - priceImpact * 0.6 / 100)).toFixed(0)}`,
        impact: `${(priceImpact * 0.6).toFixed(1)}%`,
        probability: `${Math.max(10, 60 - priceImpact * 3).toFixed(0)}%`
      },
      {
        price: `$${(currentPrice * (1 - priceImpact / 100)).toFixed(0)}`,
        impact: `${priceImpact.toFixed(1)}%`,
        probability: `${Math.max(5, 30 - priceImpact * 2).toFixed(0)}%`
      }
    ];
    
    return {
      priceImpact: priceImpact.toFixed(2),
      liquidityDrain: liquidityDrain.toFixed(1),
      volumeSpike,
      recoveryHours,
      cascadeRisk,
      affectedTokens: Math.round(whaleCount * 1.5),
      arbitrageOpportunities: Math.round(priceImpact * 2),
      riskZones
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'simulate') {
      const body = await req.json()
      const simulator = new MarketImpactSimulator()
      const result = simulator.simulate(body)
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate mock predictions for demo
    const mockPredictions = [
      {
        id: '1',
        type: 'accumulation',
        confidence: 87.5,
        whale_address: '0x742d35Cc6aB3C0532C4C2C0532C4C2C0532C4C25a3',
        predicted_amount: 2500,
        timeframe: '6-12 hours',
        impact_score: 8.2,
        explanation: ['Large inflow pattern detected', 'Historical accumulation behavior', 'Low market liquidity window'],
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        type: 'liquidation',
        confidence: 94.2,
        whale_address: '0x8ba1f109eddd4bd1c328681c71137145c5af8223',
        predicted_amount: 5000,
        timeframe: '2-4 hours',
        impact_score: 9.1,
        explanation: ['Stress indicators in portfolio', 'Similar pattern to previous liquidations', 'High leverage exposure'],
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        type: 'cluster_movement',
        confidence: 76.8,
        whale_address: 'Multiple addresses',
        predicted_amount: 15000,
        timeframe: '24-48 hours',
        impact_score: 7.5,
        explanation: ['Coordinated wallet activity', 'Similar transaction timing', 'Cross-exchange movements'],
        created_at: new Date().toISOString()
      }
    ];

    return new Response(JSON.stringify({ predictions: mockPredictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})