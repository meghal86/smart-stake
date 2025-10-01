import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (Deno.env.get('NEXT_PUBLIC_DATA_MODE') === 'mock') {
    return mockSpotlightData()
  }
  
  try {
    const { data } = await supabase
      .from('whale_transfers')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24*60*60*1000).toISOString())
      .order('amount_usd', { ascending: false })
    
    const largest_move_usd = data?.[0]?.amount_usd || 0
    const most_active_wallet = getMostActiveWallet(data || [])
    const total_volume_usd = (data || []).reduce((sum, row) => sum + Math.abs(row.amount_usd || 0), 0)
    const tx_hash = data?.[0]?.hash
    
    const latestAge = await getLatestEventAge()
    const provenance = latestAge <= 180 ? 'Real' : 'Simulated'
    
    return new Response(JSON.stringify({
      largest_move_usd,
      most_active_wallet,
      total_volume_usd,
      tx_hash,
      last_updated_iso: new Date().toISOString(),
      provenance
    }))
  } catch (error) {
    console.error('Spotlight error:', error)
    return mockSpotlightData()
  }
})

function mockSpotlightData() {
  return new Response(JSON.stringify({
    largest_move_usd: 2500000,
    most_active_wallet: '0x742d35Cc6634C0532925a3b8D',
    total_volume_usd: 45000000,
    tx_hash: '0x123...',
    last_updated_iso: new Date().toISOString(),
    provenance: 'Simulated'
  }))
}

function getMostActiveWallet(data: any[]): string {
  const walletCounts = data.reduce((acc, row) => {
    const wallet = row.from_address || row.to_address
    if (wallet) {
      acc[wallet] = (acc[wallet] || 0) + 1
    }
    return acc
  }, {})
  
  return Object.keys(walletCounts).reduce((a, b) => 
    walletCounts[a] > walletCounts[b] ? a : b
  ) || '0x742d35Cc6634C0532925a3b8D'
}

async function getLatestEventAge(): Promise<number> {
  const { data } = await supabase
    .from('data_freshness')
    .select('age_seconds')
    .single()
  
  return data?.age_seconds || 999999
}