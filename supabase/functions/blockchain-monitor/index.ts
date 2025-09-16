import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Known whale addresses for monitoring
const WHALE_ADDRESSES = [
  '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Binance Hot Wallet
  '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', // Bitfinex Hot Wallet
  '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', // Kraken Hot Wallet
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4df93', // Coinbase Hot Wallet
  '0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489', // Huobi Hot Wallet
  '0x1111111254EEB25477B68fb85Ed929f73A960582', // 1inch Router
  '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Uniswap Router
  '0x28C6c06298d514Db089934071355E5743bf21d60', // Ethereum Foundation
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const alchemyKey = Deno.env.get('ALCHEMY_API_KEY')
    if (!alchemyKey) {
      throw new Error('ALCHEMY_API_KEY not configured')
    }

    const results = {
      balances_updated: 0,
      transfers_found: 0,
      errors: [] as string[]
    }

    // Fetch current balances for whale addresses
    for (const address of WHALE_ADDRESSES) {
      try {
        // Get ETH balance from Alchemy
        const balanceResponse = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1
          })
        })

        const balanceData = await balanceResponse.json()
        if (balanceData.error) {
          throw new Error(`Alchemy error: ${balanceData.error.message}`)
        }

        // Convert hex balance to ETH
        const balanceWei = parseInt(balanceData.result, 16)
        const balanceEth = balanceWei / 1e18
        const balanceUsd = balanceEth * 3420 // Mock ETH price

        // Get latest block number
        const blockResponse = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 2
          })
        })

        const blockData = await blockResponse.json()
        const blockNumber = parseInt(blockData.result, 16)

        // Insert/update whale balance
        const { error: insertError } = await supabase
          .from('whale_balances')
          .upsert({
            address,
            chain: 'ethereum',
            balance: balanceEth.toString(),
            balance_usd: balanceUsd,
            ts: new Date().toISOString(),
            provider: 'alchemy',
            method: 'eth_getBalance',
            block_number: blockNumber
          }, {
            onConflict: 'idempotency_key',
            ignoreDuplicates: true
          })

        if (insertError) {
          results.errors.push(`Balance insert error for ${address}: ${insertError.message}`)
        } else {
          results.balances_updated++
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        results.errors.push(`Error processing ${address}: ${error.message}`)
      }
    }

    // Fetch recent transfers for whale addresses
    try {
      const transferResponse = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: '0x' + (await getLatestBlock() - 100).toString(16), // Last 100 blocks
            toBlock: 'latest',
            fromAddress: WHALE_ADDRESSES,
            category: ['external', 'internal'],
            withMetadata: true,
            excludeZeroValue: true,
            maxCount: 100
          }],
          id: 3
        })
      })

      const transferData = await transferResponse.json()
      if (transferData.result?.transfers) {
        for (const transfer of transferData.result.transfers) {
          try {
            const value = parseFloat(transfer.value || '0')
            const valueUsd = value * 3420 // Mock ETH price

            const { error: transferError } = await supabase
              .from('whale_transfers')
              .upsert({
                tx_hash: transfer.hash,
                from_address: transfer.from,
                to_address: transfer.to,
                value: value.toString(),
                value_usd: valueUsd,
                chain: 'ethereum',
                ts: new Date(transfer.metadata?.blockTimestamp || Date.now()).toISOString(),
                provider: 'alchemy',
                method: 'alchemy_getAssetTransfers',
                block_number: parseInt(transfer.blockNum, 16),
                log_index: 0
              }, {
                onConflict: 'idempotency_key',
                ignoreDuplicates: true
              })

            if (!transferError) {
              results.transfers_found++
            }
          } catch (error) {
            results.errors.push(`Transfer processing error: ${error.message}`)
          }
        }
      }
    } catch (error) {
      results.errors.push(`Transfer fetch error: ${error.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results,
        whale_addresses_monitored: WHALE_ADDRESSES.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Blockchain monitor error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function getLatestBlock(): Promise<number> {
  const alchemyKey = Deno.env.get('ALCHEMY_API_KEY')
  const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_blockNumber',
      params: [],
      id: 1
    })
  })
  const data = await response.json()
  return parseInt(data.result, 16)
}