import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Multi-chain API endpoints
const CHAIN_APIS = {
  ethereum: 'https://api.etherscan.io/api',
  bsc: 'https://api.bscscan.com/api',
  polygon: 'https://api.polygonscan.com/api',
  avalanche: 'https://api.snowtrace.io/api'
}

// Known whale addresses per chain
const WHALE_ADDRESSES = {
  ethereum: [
    '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', // Binance 8
    '0xf977814e90da44bfa03b6295a0616a897441acec', // Binance 14
    '0x8894e0a0c962cb723c1976a4421c95949be2d4e3', // Binance 15
    '0x28c6c06298d514db089934071355e5743bf21d60', // Binance 16
    '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 17
  ],
  bsc: [
    '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
    '0x0ed943ce24baebf257488771759f9bf482c39706',
    '0x4b16c5de96eb2117bbe5fd171e4d203624b014aa'
  ],
  polygon: [
    '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf',
    '0x72a53cdbbcc1b9efa39c834a540550e23463aacb'
  ]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { chain = 'ethereum' } = await req.json().catch(() => ({}))
    const API_KEY = Deno.env.get('ETHERSCAN_API_KEY')
    
    if (!API_KEY) {
      throw new Error('API_KEY not configured')
    }

    const apiUrl = CHAIN_APIS[chain as keyof typeof CHAIN_APIS] || CHAIN_APIS.ethereum
    const whaleAddresses = WHALE_ADDRESSES[chain as keyof typeof WHALE_ADDRESSES] || WHALE_ADDRESSES.ethereum

    const whales = []

    // Check cache first
    const { data: cachedData } = await supabaseClient
      .from('whale_data_cache')
      .select('*')
      .eq('chain', chain)
      .gt('expires_at', new Date().toISOString())

    const cachedAddresses = new Set(cachedData?.map(d => d.whale_address) || [])

    for (const address of whaleAddresses) {
      try {
        let whaleData
        
        if (cachedAddresses.has(address)) {
          // Use cached data
          const cached = cachedData?.find(d => d.whale_address === address)
          whaleData = {
            balance: parseFloat(cached?.balance || '0'),
            txCount: cached?.transaction_count || 0,
            riskScore: parseFloat(cached?.risk_score || '7'),
            walletType: cached?.wallet_type || 'investment'
          }
        } else {
          // Fetch fresh data with retry logic
          let retries = 3
          while (retries > 0) {
            try {
              const [balanceResponse, txCountResponse] = await Promise.all([
                fetch(`${apiUrl}?module=account&action=balance&address=${address}&tag=latest&apikey=${API_KEY}`),
                fetch(`${apiUrl}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${API_KEY}`)
              ])

              const [balanceData, txCountData] = await Promise.all([
                balanceResponse.json(),
                txCountResponse.json()
              ])

              const balance = parseInt(balanceData.result || '0') / 1e18
              const txCount = parseInt(txCountData.result || '0x0', 16)
              const riskScore = Math.random() * 3 + 7
              const walletType = Math.random() > 0.5 ? 'trading' : 'investment'

              whaleData = { balance, txCount, riskScore, walletType }

              // Cache the data
              await supabaseClient.from('whale_data_cache').upsert({
                whale_address: address,
                chain,
                balance,
                transaction_count: txCount,
                risk_score: riskScore,
                wallet_type: walletType,
                last_activity: new Date().toISOString(),
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
              })
              break
            } catch (error) {
              retries--
              if (retries === 0) throw error
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
        }

        const roi = Math.random() * 200 + 50
        const recentActivity = Math.floor(Math.random() * 100) + 10

        whales.push({
          id: address,
          address: `${address.slice(0, 6)}...${address.slice(-4)}`,
          fullAddress: address,
          label: `${chain.toUpperCase()} Whale ${address.slice(-4)}`,
          type: whaleData.walletType,
          balance: Math.floor(whaleData.balance),
          roi: Math.floor(roi * 10) / 10,
          riskScore: Math.floor(whaleData.riskScore * 10) / 10,
          recentActivity,
          totalTxs: whaleData.txCount,
          chain,
          isWatched: false,
          activityData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 50) + 10)
        })

        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error fetching data for ${address}:`, error)
      }
    }

    // Get shared watchlists
    const { data: sharedWatchlists } = await supabaseClient
      .from('shared_watchlists')
      .select(`
        *,
        shared_watchlist_whales(*),
        watchlist_followers(count)
      `)
      .eq('is_public', true)
      .order('follower_count', { ascending: false })
      .limit(5)

    return new Response(
      JSON.stringify({ 
        success: true,
        whales: whales.sort((a, b) => b.balance - a.balance),
        sharedWatchlists: sharedWatchlists || [],
        supportedChains: Object.keys(CHAIN_APIS),
        currentChain: chain
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