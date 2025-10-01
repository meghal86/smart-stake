# 03 - Edge Functions

## Function: `ingest_whales_live`

**Path**: `supabase/functions/ingest_whales_live/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    // Get latest blocks from Alchemy
    const transfers = await fetchAlchemyTransfers()
    
    // Get prices from CoinGecko
    const prices = await fetchCoinGeckoPrices()
    
    // Process and filter (>= $250k)
    const events = processTransfers(transfers, prices)
    
    // Upsert to database
    const { data, error } = await supabase
      .from('events_whale')
      .upsert(events, { 
        onConflict: 'tx_hash,log_index',
        ignoreDuplicates: true 
      })
    
    return new Response(JSON.stringify({
      ingested: events.length,
      latestTs: events[0]?.ts
    }))
  } catch (error) {
    return new Response(JSON.stringify({ ingested: 0 }), { status: 200 })
  }
})

async function fetchAlchemyTransfers() {
  const response = await fetch('https://eth-mainnet.g.alchemy.com/v2/' + 
    Deno.env.get('ALCHEMY_API_KEY'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'alchemy_getAssetTransfers',
      params: [{
        fromBlock: 'latest',
        toBlock: 'latest',
        category: ['external', 'erc20'],
        excludeZeroValue: true,
        maxCount: '0x64',
        order: 'desc'
      }]
    })
  })
  return response.json()
}
```

## Function: `whale-spotlight`

**Path**: `supabase/functions/whale-spotlight/index.ts`

```typescript
Deno.serve(async (req) => {
  // Check data mode
  if (Deno.env.get('NEXT_PUBLIC_DATA_MODE') === 'mock') {
    return mockSpotlightData()
  }
  
  // Ensure fresh data
  await ensureFreshness()
  
  // Aggregate last 24h
  const { data } = await supabase
    .from('events_whale')
    .select('*')
    .gte('ts', new Date(Date.now() - 24*60*60*1000).toISOString())
    .order('amount_usd', { ascending: false })
  
  const largest_move_usd = data[0]?.amount_usd || 0
  const most_active_wallet = getMostActiveWallet(data)
  const total_volume_usd = data.reduce((sum, row) => sum + row.amount_usd, 0)
  const tx_hash = data[0]?.tx_hash
  
  // Determine provenance
  const latestAge = getLatestEventAge()
  const provenance = latestAge <= 180 ? 'Real' : 'Simulated'
  
  return new Response(JSON.stringify({
    largest_move_usd,
    most_active_wallet,
    total_volume_usd,
    tx_hash,
    last_updated_iso: new Date().toISOString(),
    provenance
  }))
})
```

## Function: `fear-index`

**Path**: `supabase/functions/fear-index/index.ts`

```typescript
Deno.serve(async (req) => {
  if (Deno.env.get('NEXT_PUBLIC_DATA_MODE') === 'mock') {
    return mockFearIndexData()
  }
  
  const { data } = await supabase
    .from('events_whale')
    .select('*')
    .gte('ts', new Date(Date.now() - 24*60*60*1000).toISOString())
  
  // Calculate components (0-1)
  const flowBalance = calculateFlowBalance(data)
  const volumeScore = calculateVolumeScore(data)
  const breadthScore = calculateBreadthScore(data)
  const recencyScore = calculateRecencyScore(data)
  
  // Weighted score
  const score = Math.round(100 * (
    0.35 * flowBalance +
    0.30 * volumeScore +
    0.20 * breadthScore +
    0.15 * recencyScore
  ))
  
  const label = getScoreLabel(score)
  const provenance = getLatestEventAge() <= 180 ? 'Real' : 'Simulated'
  
  return new Response(JSON.stringify({
    score,
    label,
    last_updated_iso: new Date().toISOString(),
    provenance,
    methodologyUrl: '/docs/methodology#fear-index'
  }))
})
```

## Function: `prices`

**Path**: `supabase/functions/prices/index.ts`

```typescript
Deno.serve(async (req) => {
  const url = new URL(req.url)
  const coins = url.searchParams.get('ids') || 'ethereum,bitcoin'
  
  try {
    const response = await fetch(
      `${Deno.env.get('COINGECKO_BASE')}/simple/price?ids=${coins}&vs_currencies=usd`,
      { headers: { 'Cache-Control': 'max-age=60' } }
    )
    
    const data = await response.json()
    return new Response(JSON.stringify(data))
  } catch (error) {
    return new Response(JSON.stringify({}), { status: 200 })
  }
})
```

## Deployment Commands

```bash
# Deploy all functions
supabase functions deploy ingest_whales_live
supabase functions deploy whale-spotlight  
supabase functions deploy fear-index
supabase functions deploy prices
```

---

**Next**: [Scheduling](./04-scheduling.md)