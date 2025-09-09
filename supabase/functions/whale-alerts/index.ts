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
      throw new Error('WHALE_ALERT_API_KEY not configured')
    }

    // Fetch live whale transactions from whale-alert.io API
    const response = await fetch(
      `https://api.whale-alert.io/v1/transactions?api_key=${WHALE_ALERT_API_KEY}&min_value=500000&limit=50`
    )
    
    if (!response.ok) {
      throw new Error(`Whale Alert API error: ${response.status}`)
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data.transactions?.length || 0,
        transactions: data.transactions || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})