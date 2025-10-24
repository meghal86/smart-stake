import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit } from '../_lib/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Filters {
  type?: string
  chains?: string[]
  difficulty?: string[]
  onlyVerified?: boolean
  search?: string
  page?: number
  wallet?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const rl = await checkRateLimit(`hunter-list:${ip}`, 60, 3600)
    if (!rl.success) {
      return new Response(JSON.stringify({ success: false, error: { code: 'RATE_LIMITED' } }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body: { filters?: Filters } = await req.json().catch(() => ({}))
    const f = body.filters || {}

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)

    let query = supabase.from('opportunities').select('*')

    if (f.type) query = query.eq('type', f.type)
    if (f.onlyVerified) query = query.eq('is_verified', true)
    if (f.chains && f.chains.length) query = query.contains('chains', f.chains)
    if (f.search) query = query.or(`title.ilike.%${f.search}%,protocol.ilike.%${f.search}%`)

    const { data, error } = await query.order('featured', { ascending: false }).order('created_at', { ascending: false })
    if (error) throw error

    // Basic curation: sort by reward and trust
    const list = (data || []).sort((a: any, b: any) => {
      const rewardA = (a.reward_min || 0) + (a.reward_max || 0)
      const rewardB = (b.reward_min || 0) + (b.reward_max || 0)
      const t = (rewardB + (b.trust_score || 0) / 5) - (rewardA + (a.trust_score || 0) / 5)
      return t
    })

    const page = Math.max(1, f.page || 1)
    const pageSize = 20
    const start = (page - 1) * pageSize
    const end = start + pageSize

    const pageItems = list.slice(start, end).map((o: any) => {
      const isNew = (Date.now() - new Date(o.created_at).getTime()) < 3 * 24 * 60 * 60 * 1000
      const timeUntilExpiry = o.end_date ? (new Date(o.end_date).getTime() - Date.now()) : null
      return { ...o, isNew, timeUntilExpiry }
    })

    return new Response(JSON.stringify({ success: true, data: { opportunities: pageItems, total: list.length, page, hasMore: end < list.length } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: { code: 'INTERNAL', message: e instanceof Error ? e.message : 'unknown' } }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
