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
    // Fetch Fear & Greed Index
    const fearGreedResponse = await fetch('https://api.alternative.me/fng/')
    const fearGreedData = await fearGreedResponse.json()
    
    // Fetch Bitcoin price and market data
    const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true')
    const priceData = await coinGeckoResponse.json()
    
    // Fetch global market data
    const globalResponse = await fetch('https://api.coingecko.com/api/v3/global')
    const globalData = await globalResponse.json()

    const sentiment = {
      fearGreedIndex: {
        value: parseInt(fearGreedData.data[0].value),
        classification: fearGreedData.data[0].value_classification,
        timestamp: fearGreedData.data[0].timestamp
      },
      prices: {
        bitcoin: {
          price: priceData.bitcoin.usd,
          change24h: priceData.bitcoin.usd_24h_change,
          marketCap: priceData.bitcoin.usd_market_cap
        },
        ethereum: {
          price: priceData.ethereum.usd,
          change24h: priceData.ethereum.usd_24h_change,
          marketCap: priceData.ethereum.usd_market_cap
        }
      },
      market: {
        totalMarketCap: globalData.data.total_market_cap.usd,
        totalVolume: globalData.data.total_volume.usd,
        btcDominance: globalData.data.market_cap_percentage.bitcoin,
        ethDominance: globalData.data.market_cap_percentage.ethereum,
        marketCapChange24h: globalData.data.market_cap_change_percentage_24h_usd
      },
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify({ success: true, data: sentiment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching sentiment:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch sentiment data' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})