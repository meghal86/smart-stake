import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { cacheGet, cacheSet } from '../_lib/cache.ts'
import { checkRateLimit } from '../_lib/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchDefiLlamaPools() {
  const enabled = Deno.env.get('ENABLE_DEFI_LLAMA') === '1'
  if (!enabled) return [] as any[]
  const cached = await cacheGet<any[]>('defillama:pools')
  if (cached) return cached
  const base = Deno.env.get('DEFI_LLAMA_BASE') || 'https://yields.llama.fi'
  const res = await fetch(`${base}/pools`)
  if (!res.ok) throw new Error(`defillama ${res.status}`)
  const json = await res.json()
  const pools = json?.data || []
  await cacheSet('defillama:pools', pools, 300)
  return pools
}

function toSlug(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function updateTrustForProtocol(address?: string|null) {
  if (!address) return { trust_score: 70, is_verified: false }
  // Simple Etherscan heuristic: if contract source exists, boost score
  const apiKey = Deno.env.get('ETHERSCAN_API_KEY')
  const chain = 'ethereum'
  const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey || ''}`
  try {
    const r = await fetch(url)
    const j = await r.json()
    const source = j?.result?.[0]
    const verified = source && source.ABI && source.ABI !== 'Contract source code not verified'
    return { trust_score: verified ? 90 : 65, is_verified: !!verified }
  } catch {
    return { trust_score: 70, is_verified: false }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // AuthZ via CRON secret
    const auth = req.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    const expected = Deno.env.get('CRON_SECRET') || ''
    if (!expected || token !== expected) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED' } }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Rate limit per IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const rl = await checkRateLimit(`hunter-refresh:${ip}`, 30, 3600)
    if (!rl.success) {
      return new Response(JSON.stringify({ success: false, error: { code: 'RATE_LIMITED' } }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Fetch sources
    const pools = await fetchDefiLlamaPools()

    // Upsert top by TVL up to 200
    let inserted = 0, updated = 0, expired = 0
    const top = pools
      .filter((p: any) => p?.tvlUsd && p?.apy)
      .sort((a: any,b: any) => (b.tvlUsd||0) - (a.tvlUsd||0))
      .slice(0, 200)

    for (const pool of top) {
      const type = (pool.project || '').toLowerCase().includes('stake') ? 'staking' : 'yield'
      const slug = toSlug(`${pool.symbol || 'pool'}-${pool.project || 'proto'}-${pool.chain || 'chain'}`)
      const trust = await updateTrustForProtocol(pool.pool || null)
      const row = {
        slug,
        title: `${pool.symbol || ''} on ${pool.project || ''}`.trim(),
        protocol: pool.project || 'Unknown',
        type,
        chains: [pool.chain || 'ethereum'],
        reward_currency: 'USD',
        reward_confidence: 'estimated',
        difficulty: 'medium',
        time_required: 'ongoing',
        trust_score: trust.trust_score,
        is_verified: trust.is_verified,
        audited: false,
        urgency: 'low',
        requirements: { chains: [pool.chain || 'ethereum'] },
        steps: [],
        category: ['yield'],
        tags: [pool.symbol || ''],
        featured: false,
        participants: null,
        apr: pool.apyBase ?? null,
        apy: pool.apy ?? null,
        tvl_usd: pool.tvlUsd ?? null,
        thumbnail: null,
        banner: null,
        protocol_logo: null,
        source: 'defillama',
        source_ref: pool.pool || null,
        protocol_address: pool.pool || null,
        updated_at: new Date().toISOString(),
      }

      const { data: existing } = await supabase.from('opportunities').select('id').eq('slug', slug).maybeSingle()
      if (existing?.id) {
        const { error } = await supabase.from('opportunities').update(row).eq('id', existing.id)
        if (!error) updated++
      } else {
        const { error } = await supabase.from('opportunities').insert({ ...row, created_at: new Date().toISOString(), title: row.title })
        if (!error) inserted++
      }
    }

    // Mark expired ones where end_date passed
    const { data: opps } = await supabase.from('opportunities').select('id,end_date')
    if (opps) {
      for (const o of opps) {
        if (o.end_date && new Date(o.end_date) < new Date()) expired++
      }
    }

    return new Response(JSON.stringify({ success: true, data: { updated, inserted, expired } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: { code: 'INTERNAL', message: e instanceof Error ? e.message : 'unknown' } }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

