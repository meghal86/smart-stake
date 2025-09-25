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

    const { window = '24h', include_chain_risk = false } = await req.json().catch(() => ({}))

    // Get chain risk data - varies by time window
    let chainRisk = {}
    if (include_chain_risk) {
      // Different risk values based on time window
      const riskData = {
        '24h': [
          { chain: 'BTC', risk: 22, components: { cexInflow: 9, netOutflow: 7, dormantWake: 6 } },
          { chain: 'ETH', risk: 45, components: { cexInflow: 18, netOutflow: 14, dormantWake: 13 } },
          { chain: 'SOL', risk: 67, components: { cexInflow: 27, netOutflow: 20, dormantWake: 20 } },
          { chain: 'OTHERS', risk: null, reason: 'insufficient_data', components: null }
        ],
        '7d': [
          { chain: 'BTC', risk: 35, components: { cexInflow: 14, netOutflow: 11, dormantWake: 10 } },
          { chain: 'ETH', risk: 58, components: { cexInflow: 23, netOutflow: 18, dormantWake: 17 } },
          { chain: 'SOL', risk: 72, components: { cexInflow: 29, netOutflow: 22, dormantWake: 21 } },
          { chain: 'OTHERS', risk: 28, components: { cexInflow: 11, netOutflow: 8, dormantWake: 9 } }
        ],
        '30d': [
          { chain: 'BTC', risk: 18, components: { cexInflow: 7, netOutflow: 5, dormantWake: 6 } },
          { chain: 'ETH', risk: 52, components: { cexInflow: 21, netOutflow: 16, dormantWake: 15 } },
          { chain: 'SOL', risk: 69, components: { cexInflow: 28, netOutflow: 21, dormantWake: 20 } },
          { chain: 'OTHERS', risk: 31, components: { cexInflow: 12, netOutflow: 9, dormantWake: 10 } }
        ]
      }

      const chains = (riskData[window] || riskData['24h']).map(item => ({
        ...item,
        reason: item.risk === null ? 'insufficient_data' : null
      }))

      chainRisk = {
        chains,
        refreshedAt: new Date().toISOString(),
        window
      }
    }

    const response = {
      refreshedAt: new Date().toISOString(),
      chainRisk,
      window
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})