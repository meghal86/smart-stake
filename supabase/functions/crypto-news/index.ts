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
    const { coinSymbol } = await req.json()
    
    // Use CryptoCompare free news API
    const newsResponse = await fetch(
      `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest&categories=${coinSymbol || 'BTC'}`
    )
    
    if (!newsResponse.ok) {
      throw new Error('Failed to fetch news')
    }
    
    const newsData = await newsResponse.json()
    
    // Process and format news data
    const processedNews = newsData.Data.slice(0, 5).map((article: any, index: number) => {
      // Simple sentiment analysis based on title keywords
      const title = article.title.toLowerCase()
      let sentiment = 'neutral'
      let sentimentScore = 50
      
      const positiveWords = ['surge', 'rally', 'bullish', 'gains', 'up', 'rise', 'partnership', 'adoption', 'breakthrough']
      const negativeWords = ['crash', 'drop', 'bearish', 'falls', 'down', 'decline', 'hack', 'ban', 'regulation']
      
      const positiveCount = positiveWords.filter(word => title.includes(word)).length
      const negativeCount = negativeWords.filter(word => title.includes(word)).length
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive'
        sentimentScore = Math.min(85, 60 + (positiveCount * 10))
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative'
        sentimentScore = Math.max(15, 40 - (negativeCount * 10))
      }
      
      // Determine badge based on categories and sentiment
      let badge = null
      if (article.categories.includes('Trading') || article.categories.includes('Market')) {
        badge = 'Hot'
      } else if (sentiment === 'positive' && sentimentScore > 75) {
        badge = 'Most Mentioned'
      }
      
      return {
        id: article.id,
        title: article.title,
        time: new Date(article.published_on * 1000).toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          day: 'numeric',
          month: 'short'
        }),
        source: article.source_info.name,
        excerpt: article.body.substring(0, 200) + '...',
        sentiment: sentiment,
        sentimentScore: sentimentScore,
        badge: badge,
        url: article.url,
        imageUrl: article.imageurl,
        categories: article.categories.split('|'),
        keyPoints: [
          `Published by ${article.source_info.name}`,
          `Categories: ${article.categories.replace('|', ', ')}`,
          `Sentiment analysis: ${sentiment} (${sentimentScore}/100)`
        ]
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        news: processedNews,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching crypto news:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch news data' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})