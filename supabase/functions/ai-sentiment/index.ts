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
    const { text } = await req.json()
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch live market data
    const fearGreedResponse = await fetch('https://api.alternative.me/fng/')
    const fearGreedData = await fearGreedResponse.json()
    
    const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true')
    const priceData = await coinGeckoResponse.json()
    
    const globalResponse = await fetch('https://api.coingecko.com/api/v3/global')
    const globalData = await globalResponse.json()

    // Format market data
    const fearGreedIndex = fearGreedData.data[0].value
    const btcPrice = priceData.bitcoin.usd
    const ethPrice = priceData.ethereum.usd
    const btcDominance = globalData.data.market_cap_percentage.bitcoin.toFixed(1)
    const ethDominance = globalData.data.market_cap_percentage.ethereum.toFixed(1)
    const totalMarketCap = (globalData.data.total_market_cap.usd / 1e12).toFixed(2)
    const marketVolume = (globalData.data.total_volume.usd / 1e9).toFixed(1)

    // Create AI prompt
    const prompt = `You are a crypto market analyst AI.

Using the following current market data:

- Fear & Greed Index: ${fearGreedIndex} (scale 0-100)  
- Bitcoin Price (BTC): $${btcPrice}  
- Ethereum Price (ETH): $${ethPrice}  
- Market Dominance: BTC ${btcDominance}%, ETH ${ethDominance}%  
- Total Crypto Market Cap: $${totalMarketCap} trillion  
- 24h Market Volume: $${marketVolume} billion

Analyze the overall sentiment and market mood in relation to Bitcoin and Ethereum.

Given the news or social media text below, provide:

1. Sentiment scores for BTC and ETH, from 1 (very negative) to 10 (very positive).  
2. A concise explanation of the factors influencing this sentiment, combining price trends, market dominance, volume, and Fear & Greed context.

Text to analyze: """${text}"""

Please respond only in this JSON format:

{
  "BTC_sentiment_score": number,
  "BTC_sentiment_explanation": "string",
  "ETH_sentiment_score": number,
  "ETH_sentiment_explanation": "string"
}`

    // Call OpenAI API (you'll need to set OPENAI_API_KEY in Supabase secrets)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      })
    })

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed')
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    // Parse JSON response
    const sentimentAnalysis = JSON.parse(aiResponse)

    return new Response(
      JSON.stringify({
        success: true,
        analysis: sentimentAnalysis,
        marketData: {
          fearGreedIndex,
          btcPrice,
          ethPrice,
          btcDominance,
          ethDominance,
          totalMarketCap,
          marketVolume
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in AI sentiment analysis:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to analyze sentiment' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})