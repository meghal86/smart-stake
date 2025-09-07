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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Sample whale addresses with mock data
    const whaleAddresses = [
      '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a',
      '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
      '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b'
    ]

    // Create whale profiles
    for (const address of whaleAddresses) {
      const { error: profileError } = await supabase.from('whale_profiles').upsert({
        address,
        chain: 'ethereum',
        label: `Whale ${address.slice(-4)}`,
        category: 'whale',
        total_volume: Math.random() * 100000000,
        transaction_count: Math.floor(Math.random() * 1000) + 100,
        balance_usd: Math.random() * 50000000,
        risk_score: Math.floor(Math.random() * 30),
        tags: ['large_holder', 'active_trader']
      })
      if (profileError) console.error('Profile error:', profileError)

      // Add sample transactions
      for (let i = 0; i < 20; i++) {
        const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        const { error: txError } = await supabase.from('whale_transactions').upsert({
          whale_address: address,
          chain: 'ethereum',
          tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          timestamp,
          from_address: address,
          to_address: `0x${Math.random().toString(16).substr(2, 40)}`,
          token_symbol: ['USDT', 'USDC', 'ETH', 'WBTC'][Math.floor(Math.random() * 4)],
          amount: Math.random() * 1000000,
          amount_usd: Math.random() * 1000000,
          transaction_type: ['buy', 'sell', 'transfer'][Math.floor(Math.random() * 3)]
        })
        if (txError) console.error('Transaction error:', txError)
      }

      // Add portfolio holdings
      const tokens = ['USDT', 'USDC', 'ETH', 'WBTC', 'LINK']
      for (const token of tokens) {
        const balance_usd = Math.random() * 10000000
        const { error: portfolioError } = await supabase.from('whale_portfolios').upsert({
          whale_address: address,
          chain: 'ethereum',
          token_address: `0x${Math.random().toString(16).substr(2, 40)}`,
          token_symbol: token,
          token_name: token,
          balance: Math.random() * 1000000,
          balance_usd,
          pnl_usd: (Math.random() - 0.5) * balance_usd * 0.3,
          pnl_percentage: (Math.random() - 0.5) * 60
        })
        if (portfolioError) console.error('Portfolio error:', portfolioError)
      }

      // Add counterparties
      for (let i = 0; i < 10; i++) {
        const { error: counterpartyError } = await supabase.from('whale_counterparties').upsert({
          whale_address: address,
          counterparty_address: `0x${Math.random().toString(16).substr(2, 40)}`,
          chain: 'ethereum',
          interaction_count: Math.floor(Math.random() * 50) + 1,
          total_volume_usd: Math.random() * 5000000
        })
        if (counterpartyError) console.error('Counterparty error:', counterpartyError)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Sample whale data populated' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error populating whale data:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to populate whale data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})