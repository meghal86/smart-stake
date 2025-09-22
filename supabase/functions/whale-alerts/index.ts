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
    // Add start_date parameter to get only recent transactions (last 24 hours)
    const oneDayAgo = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    const apiUrl = `https://api.whale-alert.io/v1/transactions?api_key=${WHALE_ALERT_API_KEY}&min_value=500000&limit=50&start_date=${oneDayAgo}`;
    console.log('Calling Whale Alert API:', apiUrl.replace(WHALE_ALERT_API_KEY, '[API_KEY_HIDDEN]'));
    console.log('Requesting transactions from:', new Date(oneDayAgo * 1000).toISOString());
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      throw new Error(`Whale Alert API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Log the raw API response for debugging
    console.log('=== WHALE ALERT API RAW RESPONSE ===');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.transactions && data.transactions.length > 0) {
      console.log('Sample transaction timestamps:');
      data.transactions.slice(0, 3).forEach((tx, i) => {
        const timestamp = new Date(tx.timestamp * 1000);
        const ageHours = Math.round((Date.now() - timestamp.getTime()) / (1000 * 60 * 60));
        console.log(`Transaction ${i + 1}: ${timestamp.toISOString()} (${ageHours}h ago) - $${tx.amount_usd}`);
      });
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data.transactions?.length || 0,
        transactions: data.transactions || [],
        debug: {
          apiResponseTime: new Date().toISOString(),
          sampleTimestamps: data.transactions?.slice(0, 3).map(tx => ({
            raw: tx.timestamp,
            parsed: new Date(tx.timestamp * 1000).toISOString(),
            ageHours: Math.round((Date.now() - new Date(tx.timestamp * 1000).getTime()) / (1000 * 60 * 60))
          })) || []
        }
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