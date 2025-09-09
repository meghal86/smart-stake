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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Fetch live whale alerts from database
    const { data: alerts, error } = await supabaseClient
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Transform alerts for frontend
    const whaleAlerts = alerts?.map(alert => ({
      id: alert.id,
      hash: alert.tx_hash,
      from: alert.from_addr,
      to: alert.to_addr,
      amount: alert.amount_usd,
      token: alert.token,
      chain: alert.chain,
      timestamp: alert.created_at,
      blockNumber: alert.block_number,
      type: determineTransactionType(alert.from_addr, alert.to_addr),
      riskLevel: calculateRiskLevel(alert.amount_usd)
    })) || []

    // Get current market data
    const ethPrice = await getCurrentEthPrice()
    const marketCap = await getMarketCap()

    return new Response(
      JSON.stringify({
        success: true,
        alerts: whaleAlerts,
        marketData: {
          ethPrice,
          marketCap,
          totalWhaleVolume24h: calculateTotalVolume24h(whaleAlerts),
          activeWhales: countActiveWhales(whaleAlerts)
        },
        lastUpdated: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Real whale alerts error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

function determineTransactionType(from: string, to: string): string {
  // Known exchange addresses (simplified)
  const exchanges = [
    '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
    '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 2
    '0x564286362092d8e7936f0549571a803b203aaced', // Binance 3
    '0x0681d8db095565fe8a346fa0277bffde9c0edbbf', // Kraken
    '0xe93381fb4c4f14bda253907b18fad305d799241a', // Huobi
    '0x32be343b94f860124dc4fee278fdcbd38c102d88', // Poloniex
  ]

  const isFromExchange = exchanges.includes(from.toLowerCase())
  const isToExchange = exchanges.includes(to.toLowerCase())

  if (isFromExchange && !isToExchange) return 'withdrawal'
  if (!isFromExchange && isToExchange) return 'deposit'
  if (isFromExchange && isToExchange) return 'exchange_transfer'
  return 'wallet_transfer'
}

function calculateRiskLevel(amountUsd: number): 'low' | 'medium' | 'high' | 'critical' {
  if (amountUsd > 50000000) return 'critical'  // $50M+
  if (amountUsd > 10000000) return 'high'      // $10M+
  if (amountUsd > 1000000) return 'medium'     // $1M+
  return 'low'
}

function calculateTotalVolume24h(alerts: any[]): number {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  
  return alerts
    .filter(alert => now - new Date(alert.timestamp).getTime() < dayMs)
    .reduce((sum, alert) => sum + (alert.amount || 0), 0)
}

function countActiveWhales(alerts: any[]): number {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  
  const activeAddresses = new Set()
  
  alerts
    .filter(alert => now - new Date(alert.timestamp).getTime() < dayMs)
    .forEach(alert => {
      activeAddresses.add(alert.from)
      activeAddresses.add(alert.to)
    })
  
  return activeAddresses.size
}

async function getCurrentEthPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
    const data = await response.json()
    return data.ethereum?.usd || 3500
  } catch (error) {
    return 3500
  }
}

async function getMarketCap(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_market_cap=true')
    const data = await response.json()
    return data.ethereum?.usd_market_cap || 420000000000
  } catch (error) {
    return 420000000000
  }
}