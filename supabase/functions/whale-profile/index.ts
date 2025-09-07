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
    const url = new URL(req.url)
    const address = url.searchParams.get('address')
    const chain = url.searchParams.get('chain') || 'ethereum'

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return mock data for now to avoid database issues
    const mockProfile = {
      profile: {
        address,
        chain,
        label: `Whale ${address.slice(-4)}`,
        category: 'whale',
        first_seen: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_active: new Date().toISOString(),
        total_volume: Math.random() * 100000000,
        transaction_count: Math.floor(Math.random() * 1000) + 100,
        balance_usd: Math.random() * 50000000,
        risk_score: Math.floor(Math.random() * 30),
        tags: ['large_holder', 'active_trader']
      },
      transactions: Array.from({length: 20}, (_, i) => ({
        id: `tx-${i}`,
        whale_address: address,
        chain,
        tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        from_address: address,
        to_address: `0x${Math.random().toString(16).substr(2, 40)}`,
        token_symbol: ['USDT', 'USDC', 'ETH', 'WBTC'][i % 4],
        token_name: ['Tether USD', 'USD Coin', 'Ethereum', 'Wrapped Bitcoin'][i % 4],
        amount: Math.random() * 1000000,
        amount_usd: Math.random() * 1000000,
        transaction_type: ['buy', 'sell', 'transfer'][i % 3]
      })),
      portfolio: ['USDT', 'USDC', 'ETH', 'WBTC', 'LINK'].map((token, i) => {
        const balance_usd = Math.random() * 10000000
        return {
          id: `portfolio-${i}`,
          whale_address: address,
          chain,
          token_address: `0x${Math.random().toString(16).substr(2, 40)}`,
          token_symbol: token,
          token_name: token,
          balance: Math.random() * 1000000,
          balance_usd,
          pnl_usd: (Math.random() - 0.5) * balance_usd * 0.3,
          pnl_percentage: (Math.random() - 0.5) * 60
        }
      }),
      counterparties: Array.from({length: 10}, (_, i) => ({
        id: `cp-${i}`,
        whale_address: address,
        counterparty_address: `0x${Math.random().toString(16).substr(2, 40)}`,
        chain,
        interaction_count: Math.floor(Math.random() * 50) + 1,
        total_volume_usd: Math.random() * 5000000,
        first_interaction: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_interaction: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      })),
      metrics: {},
      analytics: {}
    }

    // Calculate metrics
    const totalPortfolioValue = mockProfile.portfolio.reduce((sum, holding) => sum + holding.balance_usd, 0)
    const volume30d = mockProfile.transactions.reduce((sum, tx) => sum + tx.amount_usd, 0)
    
    mockProfile.metrics = {
      total_portfolio_value: totalPortfolioValue,
      volume_30d: volume30d,
      volume_7d: volume30d * 0.3,
      transactions_30d: mockProfile.transactions.length,
      transactions_7d: Math.floor(mockProfile.transactions.length * 0.3),
      avg_transaction_size: volume30d / mockProfile.transactions.length,
      token_diversity: mockProfile.portfolio.length,
      top_token: mockProfile.portfolio[0]?.token_symbol
    }

    // Calculate analytics
    const tokenStats = mockProfile.portfolio.reduce((acc, holding) => {
      acc[holding.token_symbol] = {
        balance_usd: holding.balance_usd,
        pnl_usd: holding.pnl_usd,
        pnl_percentage: holding.pnl_percentage,
        percentage: totalPortfolioValue > 0 ? (holding.balance_usd / totalPortfolioValue) * 100 : 0
      }
      return acc
    }, {})

    const txTypeStats = mockProfile.transactions.reduce((acc, tx) => {
      acc[tx.transaction_type] = (acc[tx.transaction_type] || 0) + 1
      return acc
    }, {})

    const activityTimeline = Array.from({length: 30}, (_, i) => {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      return {
        date: date.toISOString().split('T')[0],
        volume: Math.random() * 1000000,
        transactions: Math.floor(Math.random() * 10)
      }
    }).reverse()

    mockProfile.analytics = {
      token_distribution: tokenStats,
      transaction_types: txTypeStats,
      activity_timeline: activityTimeline,
      performance: {
        total_pnl: mockProfile.portfolio.reduce((sum, holding) => sum + holding.pnl_usd, 0),
        winning_positions: mockProfile.portfolio.filter(holding => holding.pnl_usd > 0).length,
        losing_positions: mockProfile.portfolio.filter(holding => holding.pnl_usd < 0).length
      }
    }

    return new Response(
      JSON.stringify(mockProfile),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching whale profile:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch whale profile' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})