import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const responseSchema = z.object({
  whalePressure: z.number(),
  marketSentiment: z.number(),
  riskIndex: z.number(),
  activeWhales: z.number(),
  updatedAt: z.string()
})

const fetchWithTimeout = async (url: string, timeout = 8000) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let whaleInflow = 125, whaleOutflow = 87, btcDominance = 52, activeWhales = 76
    let fallbackUsed = false

    try {
      const [whaleData, marketData] = await Promise.all([
        fetchWithTimeout('https://api.whale-alert.io/v1/transactions?api_key=' + Deno.env.get('WHALE_ALERT_API_KEY')),
        fetchWithTimeout('https://api.coingecko.com/api/v3/global')
      ])

      if (whaleData.ok) {
        const data = await whaleData.json()
        whaleInflow = data.inflow || 125
        whaleOutflow = data.outflow || 87
        activeWhales = data.count || 76
      }

      if (marketData.ok) {
        const data = await marketData.json()
        btcDominance = data.data?.market_cap_percentage?.btc || 52
      }
    } catch (error) {
      console.error('API fetch error:', error)
      fallbackUsed = true
    }

    const whalePressure = whaleOutflow > 0 ? (whaleInflow / whaleOutflow) * 100 : 100
    const marketSentiment = btcDominance > 55 ? 73 : btcDominance > 50 ? 65 : 45
    const volatility = 35
    const riskIndex = (volatility + (100 - activeWhales / 5)) / 2

    const result = responseSchema.parse({
      whalePressure: Math.round(whalePressure),
      marketSentiment: Math.round(marketSentiment),
      riskIndex: Math.round(riskIndex),
      activeWhales,
      updatedAt: new Date().toISOString()
    })

    console.log({ fallbackUsed, timestamp: result.updatedAt })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
