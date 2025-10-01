import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (Deno.env.get('NEXT_PUBLIC_DATA_MODE') === 'mock') {
    return mockFearIndexData()
  }
  
  try {
    const { data } = await supabase
      .from('whale_transfers')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24*60*60*1000).toISOString())
    
    const flowBalance = calculateFlowBalance(data || [])
    const volumeScore = calculateVolumeScore(data || [])
    const breadthScore = calculateBreadthScore(data || [])
    const recencyScore = calculateRecencyScore(data || [])
    
    const score = Math.round(100 * (
      0.35 * flowBalance +
      0.30 * volumeScore +
      0.20 * breadthScore +
      0.15 * recencyScore
    ))
    
    const label = getScoreLabel(score)
    const latestAge = await getLatestEventAge()
    const provenance = latestAge <= 180 ? 'Real' : 'Simulated'
    
    return new Response(JSON.stringify({
      score,
      label,
      last_updated_iso: new Date().toISOString(),
      provenance,
      methodologyUrl: '/docs/methodology#fear-index'
    }))
  } catch (error) {
    console.error('Fear index error:', error)
    return mockFearIndexData()
  }
})

function mockFearIndexData() {
  return new Response(JSON.stringify({
    score: 67,
    label: 'Accumulation',
    last_updated_iso: new Date().toISOString(),
    provenance: 'Simulated',
    methodologyUrl: '/docs/methodology#fear-index'
  }))
}

function calculateFlowBalance(data: any[]): number {
  const inflow = data.filter(d => d.direction === 'inflow').reduce((sum, d) => sum + d.amount_usd, 0)
  const outflow = data.filter(d => d.direction === 'outflow').reduce((sum, d) => sum + d.amount_usd, 0)
  const total = inflow + outflow
  return total > 0 ? inflow / total : 0.5
}

function calculateVolumeScore(data: any[]): number {
  const totalVolume = data.reduce((sum, d) => sum + d.amount_usd, 0)
  return Math.min(1, Math.log10(totalVolume / 1000000) / 3)
}

function calculateBreadthScore(data: any[]): number {
  const uniqueWallets = new Set(data.map(d => d.from_address || d.to_address)).size
  return Math.min(1, uniqueWallets / 100)
}

function calculateRecencyScore(data: any[]): number {
  const now = Date.now()
  const recentEvents = data.filter(d => (now - new Date(d.timestamp).getTime()) < 3600000)
  return data.length > 0 ? recentEvents.length / data.length : 0
}

function getScoreLabel(score: number): string {
  if (score <= 24) return 'Extreme fear'
  if (score <= 44) return 'Fear'
  if (score <= 55) return 'Neutral'
  if (score <= 74) return 'Accumulation'
  return 'Aggressive accumulation'
}

async function getLatestEventAge(): Promise<number> {
  const { data } = await supabase
    .from('data_freshness')
    .select('age_seconds')
    .single()
  
  return data?.age_seconds || 999999
}