import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
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

    // Fetch live whale transactions from multiple sources
    const whaleTransactions = await fetchLiveWhaleData()
    
    // Store in database
    for (const tx of whaleTransactions) {
      const valueInEth = parseFloat(tx.value) / Math.pow(10, 18)
      const valueInUsd = valueInEth * await getCurrentEthPrice()
      
      // Only process transactions > $1M
      if (valueInUsd > 1000000) {
        await supabaseClient
          .from('alerts')
          .insert({
            tx_hash: tx.hash,
            from_addr: tx.from,
            to_addr: tx.to,
            token: 'ETH',
            chain: 'ethereum',
            amount_usd: valueInUsd,
            amount_token: valueInEth,
            block_number: tx.blockNumber,
            timestamp: new Date(tx.timestamp * 1000).toISOString(),
            gas_used: tx.gasUsed,
            gas_price: tx.gasPrice
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processedTransactions: whaleTransactions.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Live whale tracker error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

async function fetchLiveWhaleData(): Promise<WhaleTransaction[]> {
  const transactions: WhaleTransaction[] = []
  
  try {
    // Use Alchemy API for real-time data
    const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${Deno.env.get('ALCHEMY_API_KEY')}`
    
    // Get latest block
    const latestBlockResponse = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    })
    
    const latestBlockData = await latestBlockResponse.json()
    const latestBlock = parseInt(latestBlockData.result, 16)
    
    // Fetch last 10 blocks for whale transactions
    for (let i = 0; i < 10; i++) {
      const blockNumber = latestBlock - i
      const blockHex = '0x' + blockNumber.toString(16)
      
      const blockResponse = await fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: [blockHex, true],
          id: 1
        })
      })
      
      const blockData = await blockResponse.json()
      
      if (blockData.result?.transactions) {
        for (const tx of blockData.result.transactions) {
          const valueInWei = parseInt(tx.value, 16)
          const valueInEth = valueInWei / Math.pow(10, 18)
          
          // Filter for whale transactions (>100 ETH)
          if (valueInEth > 100) {
            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              timestamp: parseInt(blockData.result.timestamp, 16),
              blockNumber: parseInt(tx.blockNumber, 16),
              gasUsed: tx.gas,
              gasPrice: tx.gasPrice
            })
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error fetching from Alchemy:', error)
    
    // Fallback to Etherscan
    try {
      const etherscanResponse = await fetch(
        `https://api.etherscan.io/api?module=account&action=txlist&address=0x00000000219ab540356cBB839Cbe05303d7705Fa&startblock=0&endblock=99999999&sort=desc&apikey=${Deno.env.get('ETHERSCAN_API_KEY')}&page=1&offset=50`
      )
      
      const etherscanData = await etherscanResponse.json()
      
      if (etherscanData.status === '1') {
        for (const tx of etherscanData.result.slice(0, 20)) {
          const valueInEth = parseInt(tx.value) / Math.pow(10, 18)
          
          if (valueInEth > 100) {
            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              timestamp: parseInt(tx.timeStamp),
              blockNumber: parseInt(tx.blockNumber),
              gasUsed: tx.gasUsed,
              gasPrice: tx.gasPrice
            })
          }
        }
      }
    } catch (fallbackError) {
      console.error('Etherscan fallback failed:', fallbackError)
    }
  }
  
  return transactions
}

async function getCurrentEthPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
    const data = await response.json()
    return data.ethereum?.usd || 3500 // Fallback price
  } catch (error) {
    console.error('Error fetching ETH price:', error)
    return 3500 // Fallback price
  }
}