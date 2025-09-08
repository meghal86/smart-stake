import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOP_COINS = [
  'bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana', 'polkadot', 
  'dogecoin', 'avalanche-2', 'polygon-matic', 'chainlink', 'uniswap',
  'litecoin', 'algorand', 'cosmos', 'stellar', 'vechain', 'filecoin',
  'tron', 'ethereum-classic', 'monero'
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Batch fetch price data for top 20 coins
    const priceResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${TOP_COINS.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
    )
    
    if (!priceResponse.ok) {
      throw new Error(`CoinGecko API failed: ${priceResponse.status} ${priceResponse.statusText}`)
    }
    
    const priceData = await priceResponse.json()
    console.log('Price data:', priceData)

    // Fetch Fear & Greed Index
    const fearGreedResponse = await fetch('https://api.alternative.me/fng/')
    const fearGreedData = await fearGreedResponse.json()
    const fearGreedIndex = fearGreedData.data[0].value

    // Calculate sentiment scores for each coin
    const coinSentiments = TOP_COINS.map(coinId => {
      const coin = priceData[coinId]
      if (!coin) {
        console.log(`No data for coin: ${coinId}`)
        return null
      }

      const change24h = coin.usd_24h_change || 0
      const volume = coin.usd_24h_vol || 0
      const marketCap = coin.usd_market_cap || 0

      // Calculate normalized sentiment score (0-100)
      let sentimentScore = 50 // neutral base
      
      // Price change influence (±30 points)
      sentimentScore += Math.max(-30, Math.min(30, change24h * 3))
      
      // Fear & Greed influence (±20 points)
      sentimentScore += (fearGreedIndex - 50) * 0.4
      
      // Volume influence (±10 points based on relative volume)
      const volumeScore = Math.min(10, (volume / marketCap) * 1000)
      sentimentScore += volumeScore

      sentimentScore = Math.max(0, Math.min(100, sentimentScore))

      // Determine sentiment category
      let sentiment = 'neutral'
      if (sentimentScore >= 70) sentiment = 'positive'
      else if (sentimentScore <= 30) sentiment = 'negative'

      return {
        id: coinId,
        name: coinId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        price: coin.usd,
        change24h: change24h,
        marketCap: marketCap,
        volume: volume,
        sentimentScore: Math.round(sentimentScore),
        sentiment: sentiment,
        fearGreedIndex: fearGreedIndex
      }
    }).filter(Boolean)

    return new Response(
      JSON.stringify({
        success: true,
        data: coinSentiments,
        timestamp: new Date().toISOString(),
        fearGreedIndex: fearGreedIndex
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching multi-coin sentiment:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch multi-coin sentiment data' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})