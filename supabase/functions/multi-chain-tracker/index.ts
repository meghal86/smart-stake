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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Fetch from multiple chains in parallel
    const [ethData, polygonData, bscData] = await Promise.allSettled([
      fetchEthereumTransactions(),
      fetchPolygonTransactions(),
      fetchBSCTransactions()
    ])

    const allTransactions = []

    // Process Ethereum data
    if (ethData.status === 'fulfilled' && ethData.value) {
      allTransactions.push(...ethData.value.map(tx => ({ ...tx, chain: 'ethereum' })))
    }

    // Process Polygon data
    if (polygonData.status === 'fulfilled' && polygonData.value) {
      allTransactions.push(...polygonData.value.map(tx => ({ ...tx, chain: 'polygon' })))
    }

    // Process BSC data
    if (bscData.status === 'fulfilled' && bscData.value) {
      allTransactions.push(...bscData.value.map(tx => ({ ...tx, chain: 'bsc' })))
    }

    // Store new transactions
    for (const tx of allTransactions) {
      const { data: existing } = await supabaseClient
        .from('alerts')
        .select('id')
        .eq('tx_hash', tx.hash)
        .single()

      if (!existing && tx.amount_usd > 500000) {
        await supabaseClient
          .from('alerts')
          .insert({
            tx_hash: tx.hash,
            from_addr: tx.from,
            to_addr: tx.to,
            token: tx.token,
            chain: tx.chain,
            amount_usd: tx.amount_usd,
            timestamp: new Date(tx.timestamp * 1000).toISOString()
          })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: allTransactions.length,
        chains: {
          ethereum: ethData.status === 'fulfilled' ? ethData.value?.length || 0 : 0,
          polygon: polygonData.status === 'fulfilled' ? polygonData.value?.length || 0 : 0,
          bsc: bscData.status === 'fulfilled' ? bscData.value?.length || 0 : 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Multi-chain tracker error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

async function fetchEthereumTransactions() {
  const response = await fetch(
    `https://api.etherscan.io/api?module=account&action=txlist&address=0x00000000219ab540356cBB839Cbe05303d7705Fa&startblock=0&endblock=99999999&sort=desc&apikey=${Deno.env.get('ETHERSCAN_API_KEY')}&page=1&offset=20`
  )
  
  const data = await response.json()
  const ethPrice = await getCurrentPrice('ethereum')
  
  return data.result?.filter((tx: any) => {
    const valueInEth = parseInt(tx.value) / Math.pow(10, 18)
    return valueInEth * ethPrice > 500000
  }).map((tx: any) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    amount_usd: (parseInt(tx.value) / Math.pow(10, 18)) * ethPrice,
    token: 'ETH',
    timestamp: parseInt(tx.timeStamp)
  })) || []
}

async function fetchPolygonTransactions() {
  const response = await fetch(
    `https://api.polygonscan.com/api?module=account&action=txlist&address=0x0000000000000000000000000000000000001010&startblock=0&endblock=99999999&sort=desc&apikey=${Deno.env.get('POLYGONSCAN_API_KEY')}&page=1&offset=20`
  )
  
  const data = await response.json()
  const maticPrice = await getCurrentPrice('matic-network')
  
  return data.result?.filter((tx: any) => {
    const valueInMatic = parseInt(tx.value) / Math.pow(10, 18)
    return valueInMatic * maticPrice > 500000
  }).map((tx: any) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    amount_usd: (parseInt(tx.value) / Math.pow(10, 18)) * maticPrice,
    token: 'MATIC',
    timestamp: parseInt(tx.timeStamp)
  })) || []
}

async function fetchBSCTransactions() {
  const response = await fetch(
    `https://api.bscscan.com/api?module=account&action=txlist&address=0x0000000000000000000000000000000000000000&startblock=0&endblock=99999999&sort=desc&apikey=${Deno.env.get('BSCSCAN_API_KEY')}&page=1&offset=20`
  )
  
  const data = await response.json()
  const bnbPrice = await getCurrentPrice('binancecoin')
  
  return data.result?.filter((tx: any) => {
    const valueInBnb = parseInt(tx.value) / Math.pow(10, 18)
    return valueInBnb * bnbPrice > 500000
  }).map((tx: any) => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    amount_usd: (parseInt(tx.value) / Math.pow(10, 18)) * bnbPrice,
    token: 'BNB',
    timestamp: parseInt(tx.timeStamp)
  })) || []
}

async function getCurrentPrice(coinId: string): Promise<number> {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`)
    const data = await response.json()
    return data[coinId]?.usd || 0
  } catch (error) {
    console.error(`Error fetching ${coinId} price:`, error)
    return 0
  }
}