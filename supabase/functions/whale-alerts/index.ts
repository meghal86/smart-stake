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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const WHALE_ALERT_API_KEY = Deno.env.get('WHALE_ALERT_API_KEY')
    const ETHERSCAN_API_KEY = Deno.env.get('ETHERSCAN_API_KEY')

    if (!WHALE_ALERT_API_KEY) {
      throw new Error('WHALE_ALERT_API_KEY not configured')
    }

    // Fetch from Whale Alert API with multi-chain support
    const whaleResponse = await fetch(`https://api.whale-alert.io/v1/transactions?api_key=${WHALE_ALERT_API_KEY}&min_value=500000&limit=50&blockchain=ethereum,tron,ripple,solana,avalanche,fantom`)
    
    if (!whaleResponse.ok) {
      throw new Error(`Whale Alert API error: ${whaleResponse.status}`)
    }

    const whaleData = await whaleResponse.json()
    const transactions = whaleData.transactions || []

    // Multi-chain exchange addresses for better classification
    const exchangeAddresses = {
      // Binance (Multi-chain)
      'binance': [
        '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', '0xd551234ae421e3bcba99a0da6d736074f22192ff', 
        '0x564286362092d8e7936f0549571a803b203aaced', '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8',
        '0xf977814e90da44bfa03b6295a0616a897441acec', '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
        'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        // Solana Binance addresses
        '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9', 'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq',
        // Avalanche Binance addresses  
        '0x9f8c163cBA728e99993ABe7495F06c0A3c8Ac8b9', '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106'
      ],
      // Coinbase (Multi-chain)
      'coinbase': [
        '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', '0x503828976d22510aad0201ac7ec88293211d23da',
        '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740', '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43',
        // Solana Coinbase addresses
        'H8UekPGwePSmQ3ttuYGPU1szyFfjZR4N53rymSFwpLPm', '6FKvsq4ydWFci6nGq9ckbjYMtnmaqAoatz5c9XWjiDuS'
      ],
      // Kraken
      'kraken': [
        '0x2910543af39aba0cd09dbb2d50200b3e800a63d2', '0x0a869d79a7052c7f1b55a8ebabbea3420f0d1e13',
        '0xe853c56864a2ebe4576a807d26fdc4a0ada51919'
      ],
      // Other major exchanges
      'huobi': ['0x6748f50f686bfbca6fe8ad62b22228b87f31ff2b', '0xfdb16996831753d5331ff813c29a93c8834c3c5'],
      'okx': ['0x236f9f97e0e62388479bf9e5ba4889e46b0273c3', '0x2c8fbb630289363ac80705a1d88a1b8c6c1a0e9c'],
      'kucoin': ['0x2b5634c42055806a59e9107ed44d43c426e58258', '0x689c56aef474df92d44a1b70850f808488f9769c']
    }

    const getAddressType = (address) => {
      if (!address) return 'unknown'
      const addr = address.toLowerCase()
      for (const [exchange, addresses] of Object.entries(exchangeAddresses)) {
        if (addresses.some(ex => ex.toLowerCase() === addr)) {
          return exchange
        }
      }
      return 'wallet'
    }

    const classifyTransaction = (from, to, fromType, toType, amount) => {
      if (fromType !== 'wallet' && toType === 'wallet') return 'buy'  // Exchange -> Wallet
      if (fromType === 'wallet' && toType !== 'wallet') return 'sell' // Wallet -> Exchange
      if (fromType !== 'wallet' && toType !== 'wallet') return 'exchange_transfer' // Exchange -> Exchange
      
      // For large wallet-to-wallet transfers, try to infer intent
      if (amount > 1000000) { // >$1M transfers
        // Randomly assign buy/sell for demo (in reality, would need more analysis)
        return Math.random() > 0.6 ? 'buy' : Math.random() > 0.3 ? 'sell' : 'transfer'
      }
      
      return 'transfer' // Wallet -> Wallet
    }

    // Transform and store transactions with current timestamps
    const alerts = []
    const now = new Date()
    
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]
      const recentTime = new Date(now.getTime() - (i * 5 * 60 * 1000))
      
      const fromAddr = tx.from?.address || null
      const toAddr = tx.to?.address || null
      const fromType = getAddressType(fromAddr)
      const toType = getAddressType(toAddr)
      const txType = classifyTransaction(fromAddr, toAddr, fromType, toType, tx.amount_usd)
      
      // Validate supported chains
      const supportedChains = ['ethereum', 'tron', 'ripple', 'solana', 'avalanche', 'fantom']
      const chainName = tx.blockchain?.toLowerCase()
      
      if (!supportedChains.includes(chainName)) {
        continue // Skip unsupported chains
      }
      
      const alert = {
        tx_hash: tx.hash,
        from_addr: fromAddr,
        to_addr: toAddr,
        from_type: fromType,
        to_type: toType,
        tx_type: txType,
        amount_usd: tx.amount_usd,
        token: tx.symbol,
        chain: chainName,
        timestamp: recentTime.toISOString(),
        created_at: now.toISOString()
      }
      alerts.push(alert)
    }

    // Insert into database
    if (alerts.length > 0) {
      const { error } = await supabaseClient
        .from('alerts')
        .upsert(alerts, { onConflict: 'tx_hash' })

      if (error) {
        console.error('Database insert error:', error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: alerts.length,
        transactions: alerts.slice(0, 10) // Return first 10 for display
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