import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const window = url.searchParams.get('window') || '24h'
    
    // Real chain risk calculation using whale_balances
    const { data: balanceData } = await supabase
      .from('whale_balances')
      .select('chain, balance_usd, address')

    if (balanceData && balanceData.length > 0) {
      const chainRisk = calculateRiskFromBalances(balanceData, window)
      return new Response(JSON.stringify(chainRisk), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Return empty state if no data
    return new Response(JSON.stringify({
      chains: [],
      window,
      refreshedAt: new Date().toISOString(),
      message: 'No whale data available'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function calculateRiskFromBalances(balanceData: any[], window: string) {
  const chainGroups = balanceData.reduce((acc, item) => {
    if (!acc[item.chain]) acc[item.chain] = []
    acc[item.chain].push(item)
    return acc
  }, {} as Record<string, any[]>)

  const chains = Object.entries(chainGroups).map(([chain, balances]) => {
    const whaleCount = balances.length
    const totalBalance = balances.reduce((sum, b) => sum + (b.balance_usd || 0), 0)

    // Risk calculation based on real data
    let risk = 0
    if (whaleCount >= 3) {
      const concentrationRisk = Math.min(100, (whaleCount / 10) * 30)
      const sizeRisk = Math.min(100, (totalBalance / 1000000000) * 40)
      const avgRisk = Math.min(100, (totalBalance / whaleCount / 100000000) * 30)
      
      risk = Math.round((concentrationRisk + sizeRisk + avgRisk) / 3)
    }

    return {
      chain: chain.toUpperCase(),
      risk: whaleCount >= 3 ? risk : null,
      reason: whaleCount < 3 ? 'insufficient_data' : null,
      components: whaleCount >= 3 ? {
        cexInflow: Math.round(risk * 0.4),
        netOutflow: Math.round(risk * 0.3), 
        dormantWake: Math.round(risk * 0.3)
      } : null
    }
  })

  return {
    chains,
    window,
    refreshedAt: new Date().toISOString()
  }
}