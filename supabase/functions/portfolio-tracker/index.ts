import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { addresses } = await req.json()
    
    if (!addresses || !Array.isArray(addresses)) {
      throw new Error('Invalid addresses parameter')
    }
    
    const portfolioData: Record<string, any> = {}

    for (const address of addresses) {
      const ethBalance = Math.random() * 100
      const tokens = [
        {
          symbol: 'ETH',
          balance: ethBalance,
          value_usd: ethBalance * 2000,
          price_change_24h: (Math.random() - 0.5) * 10
        },
        {
          symbol: 'USDC', 
          balance: Math.random() * 50000,
          value_usd: Math.random() * 50000,
          price_change_24h: (Math.random() - 0.5) * 2
        }
      ]

      portfolioData[address] = {
        address,
        tokens,
        total_value_usd: tokens.reduce((sum, token) => sum + token.value_usd, 0),
        whale_interactions: Math.floor(Math.random() * 10),
        risk_score: Math.floor(Math.random() * 10) + 1
      }
    }

    return new Response(JSON.stringify(portfolioData), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    })
  }
})