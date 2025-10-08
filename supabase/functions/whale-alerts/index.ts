import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    // Initialize Supabase client for persistence
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
    
    // Store transactions in database for pattern analysis
    let storedCount = 0
    if (data.transactions && data.transactions.length > 0) {
      for (const tx of data.transactions) {
        try {
          const { error } = await supabase
            .from('whale_signals')
            .upsert({
              tx_hash: tx.hash,
              from_addr: tx.from.address || 'unknown',
              to_addr: tx.to.address || 'unknown', 
              amount_usd: tx.amount_usd,
              token: tx.symbol,
              chain: tx.blockchain || 'ethereum',
              tx_type: determineTxType(tx.from, tx.to),
              timestamp: new Date(tx.timestamp * 1000).toISOString()
            }, { onConflict: 'tx_hash' })
          
          if (!error) storedCount++
        } catch (err) {
          console.log('Failed to store transaction:', tx.hash, err.message)
        }
      }
      
      // Cleanup old records (30+ days)
      await supabase.rpc('cleanup_old_whale_signals')
      
      console.log(`Stored ${storedCount}/${data.transactions.length} new whale signals`)
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data.transactions?.length || 0,
        stored: storedCount,
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

function determineTxType(from: any, to: any): string {
  // Known exchange addresses (simplified)
  const exchanges = [
    '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
    '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 2
    '0x564286362092d8e7936f0549571a803b203aaced', // Binance 3
    '0x0681d8db095565fe8a346fa0277bffde9c0edbbf', // Kraken
    '0xe93381fb4c4f14bda253907b18fad305d799241a', // Huobi
    '0x32be343b94f860124dc4fee278fdcbd38c102d88', // Poloniex
  ]

  const fromAddr = from?.address?.toLowerCase() || ''
  const toAddr = to?.address?.toLowerCase() || ''
  
  const isFromExchange = exchanges.includes(fromAddr)
  const isToExchange = exchanges.includes(toAddr)

  if (isFromExchange && !isToExchange) return 'withdrawal'
  if (!isFromExchange && isToExchange) return 'deposit'
  if (isFromExchange && isToExchange) return 'exchange_transfer'
  return 'wallet_transfer'
}