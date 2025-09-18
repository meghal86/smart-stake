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
    const { address, transactionData } = await req.json()
    
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Analyze wallet behavior using OpenAI
    const analysis = await analyzeWalletBehavior(address, transactionData, openaiKey)

    return new Response(JSON.stringify({
      address,
      analysis,
      timestamp: new Date().toISOString()
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

async function analyzeWalletBehavior(address: string, transactionData: any, apiKey: string) {
  const prompt = `Analyze this cryptocurrency wallet behavior:
  
Address: ${address}
Transaction Summary: ${JSON.stringify(transactionData || {
  balance: "1.5 ETH",
  txCount: 45,
  avgValue: "0.1 ETH",
  interactions: ["Uniswap", "OpenSea"]
})}

Provide a brief analysis covering:
1. Risk level (Low/Medium/High)
2. Wallet type (Individual/Exchange/DeFi/Bot)
3. Key behavioral patterns
4. Recommendations

Keep response under 200 words.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'Analysis unavailable'
}