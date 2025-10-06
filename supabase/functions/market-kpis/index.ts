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
    const WHALE_ALERT_API_KEY = Deno.env.get('WHALE_ALERT_API_KEY')
    
    if (!WHALE_ALERT_API_KEY) {
      console.error('WHALE_ALERT_API_KEY not configured')
      throw new Error('WHALE_ALERT_API_KEY not configured')
    }

    // Fetch whale transactions
    const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)
    const whaleUrl = `https://api.whale-alert.io/v1/transactions?api_key=${WHALE_ALERT_API_KEY}&min_value=500000&limit=100&start_date=${oneDayAgo}`
    
    console.log('Fetching whale data...')
    const whaleResponse = await fetch(whaleUrl)
    const whaleData = await whaleResponse.json()
    const transactions = whaleData.transactions || []

    // Fetch CoinGecko market data
    console.log('Fetching CoinGecko market data...')
    const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/global')
    const marketData = await coinGeckoResponse.json()

    // Calculate whale pressure
    const inflowTxs = transactions.filter(t => t.to?.owner_type === 'exchange')
    const outflowTxs = transactions.filter(t => t.from?.owner_type === 'exchange')
    const inflows = inflowTxs.reduce((sum, t) => sum + (t.amount_usd || 0), 0)
    const outflows = outflowTxs.reduce((sum, t) => sum + (t.amount_usd || 0), 0)
    const whalePressure = outflows > 0 ? (inflows / outflows) * 100 : 100

    console.log('📊 WHALE PRESSURE CALCULATION:')
    console.log(`  Inflow transactions: ${inflowTxs.length}`)
    console.log(`  Outflow transactions: ${outflowTxs.length}`)
    console.log(`  Total inflows: $${inflows.toLocaleString()}`)
    console.log(`  Total outflows: $${outflows.toLocaleString()}`)
    console.log(`  Whale Pressure = (${inflows} / ${outflows}) * 100 = ${whalePressure.toFixed(2)}`)

    // Calculate market sentiment from BTC dominance
    const btcDominance = marketData.data?.market_cap_percentage?.btc || 50
    const marketSentiment = btcDominance > 45 ? 70 : btcDominance > 40 ? 55 : 40

    console.log('\n💭 MARKET SENTIMENT CALCULATION:')
    console.log(`  BTC Dominance: ${btcDominance.toFixed(2)}%`)
    console.log(`  Logic: ${btcDominance > 45 ? '>45% = Bullish (70)' : btcDominance > 40 ? '40-45% = Neutral (55)' : '<40% = Bearish (40)'}`)
    console.log(`  Market Sentiment: ${marketSentiment}`)

    // Calculate risk index
    const activeWhales = new Set(transactions.map(t => t.from?.address)).size
    const volatility = Math.abs(whalePressure - 100) / 2
    const riskIndex = Math.min(100, Math.round((volatility + (100 - activeWhales / 5)) / 2))

    console.log('\n⚠️ RISK INDEX CALCULATION:')
    console.log(`  Active whales: ${activeWhales}`)
    console.log(`  Volatility = |${whalePressure.toFixed(2)} - 100| / 2 = ${volatility.toFixed(2)}`)
    console.log(`  Risk Index = (${volatility.toFixed(2)} + (100 - ${activeWhales}/5)) / 2 = ${riskIndex}`)
    console.log(`  Interpretation: ${riskIndex > 70 ? 'High Risk' : riskIndex > 40 ? 'Medium Risk' : 'Low Risk'}`)

    const totalVolume = transactions.reduce((sum, t) => sum + (t.amount_usd || 0), 0)

    const result = {
      whalePressure: Math.round(whalePressure),
      pressureDelta: 5.2,
      marketSentiment: Math.round(marketSentiment),
      sentimentDelta: 3.1,
      riskIndex,
      riskDelta: -2.4,
      activeWhales,
      btcDominance: btcDominance.toFixed(2),
      totalVolume24h: totalVolume,
      transactionCount: transactions.length,
      refreshedAt: new Date().toISOString(),
      source: 'live'
    }

    console.log('\n✅ FINAL KPI RESULTS:')
    console.log(`  Whale Pressure: ${result.whalePressure} (${result.whalePressure > 100 ? 'Accumulation' : 'Distribution'})`)
    console.log(`  Market Sentiment: ${result.marketSentiment} (${result.marketSentiment > 60 ? 'Bullish' : result.marketSentiment > 40 ? 'Neutral' : 'Bearish'})`)
    console.log(`  Risk Index: ${result.riskIndex}/100 (${result.riskIndex > 70 ? 'High' : result.riskIndex > 40 ? 'Medium' : 'Low'})`)
    console.log(`  Total Volume 24h: $${totalVolume.toLocaleString()}`)
    console.log(`  Transaction Count: ${result.transactionCount}`)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        whalePressure: 73,
        pressureDelta: 5.2,
        marketSentiment: 65,
        sentimentDelta: 3.1,
        riskIndex: 45,
        riskDelta: -2.4,
        activeWhales: 1247,
        refreshedAt: new Date().toISOString(),
        fallback: true,
        source: 'fallback'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
