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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { window = '24h' } = await req.json()
    const windowMs = window === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
    const windowStart = new Date(Date.now() - windowMs).toISOString()
    const prevWindowStart = new Date(Date.now() - (windowMs * 2)).toISOString()
    const prevWindowEnd = new Date(Date.now() - windowMs).toISOString()

    // Market Mood (0-100) - based on whale sentiment and flows
    const { data: whaleSignals } = await supabase
      .from('whale_signals')
      .select('risk_score, confidence')
      .gte('ts', windowStart)

    let marketMood = 50 // Default neutral
    if (whaleSignals?.length) {
      const weightedRisk = whaleSignals.reduce((sum, signal) => 
        sum + (signal.risk_score * signal.confidence), 0
      ) / whaleSignals.reduce((sum, signal) => sum + signal.confidence, 0)
      marketMood = Math.max(0, Math.min(100, 100 - weightedRisk))
    }

    // 24h Volume from whale transfers
    const { data: volumeData } = await supabase
      .from('whale_transfers')
      .select('value_usd')
      .gte('ts', windowStart)

    const volume24h = volumeData?.reduce((sum, tx) => 
      sum + (parseFloat(tx.value_usd) || 0), 0
    ) || 0

    // Previous period volume for delta calculation
    const { data: prevVolumeData } = await supabase
      .from('whale_transfers')
      .select('value_usd')
      .gte('ts', prevWindowStart)
      .lt('ts', prevWindowEnd)

    const prevVolume = prevVolumeData?.reduce((sum, tx) => 
      sum + (parseFloat(tx.value_usd) || 0), 0
    ) || 1
    const volumeDelta = ((volume24h - prevVolume) / prevVolume) * 100

    // Active Whales count - unique addresses with activity
    const { data: activeWhalesData } = await supabase
      .from('whale_transfers')
      .select('from_address, to_address')
      .gte('ts', windowStart)

    const uniqueAddresses = new Set()
    activeWhalesData?.forEach(tx => {
      uniqueAddresses.add(tx.from_address)
      uniqueAddresses.add(tx.to_address)
    })
    const activeWhales = uniqueAddresses.size

    // Previous period active whales for delta
    const { data: prevActiveWhalesData } = await supabase
      .from('whale_transfers')
      .select('from_address, to_address')
      .gte('ts', prevWindowStart)
      .lt('ts', prevWindowEnd)

    const prevUniqueAddresses = new Set()
    prevActiveWhalesData?.forEach(tx => {
      prevUniqueAddresses.add(tx.from_address)
      prevUniqueAddresses.add(tx.to_address)
    })
    const prevActiveWhales = prevUniqueAddresses.size || 1
    const whalesDelta = ((activeWhales - prevActiveWhales) / prevActiveWhales) * 100

    // Market Risk Index (0-100) - weighted average of whale risks
    let riskIndex = 50 // Default neutral
    if (whaleSignals?.length) {
      const totalConfidence = whaleSignals.reduce((sum, signal) => sum + signal.confidence, 0)
      riskIndex = Math.round(
        whaleSignals.reduce((sum, signal) => 
          sum + (signal.risk_score * signal.confidence), 0
        ) / totalConfidence
      )
    }

    // Top 3 Critical Alerts from alert_events
    const { data: alertsData } = await supabase
      .from('alert_events')
      .select('id, severity, trigger_data, created_at')
      .gte('created_at', windowStart)
      .in('severity', ['High', 'Medium'])
      .order('created_at', { ascending: false })
      .limit(10)

    // Sort by severity and amount, take top 3
    const topAlerts = alertsData
      ?.sort((a, b) => {
        const severityWeight = { High: 3, Medium: 2, Info: 1 }
        const aWeight = severityWeight[a.severity as keyof typeof severityWeight] || 1
        const bWeight = severityWeight[b.severity as keyof typeof severityWeight] || 1
        if (aWeight !== bWeight) return bWeight - aWeight
        
        const aAmount = parseFloat(a.trigger_data?.amount_usd || '0')
        const bAmount = parseFloat(b.trigger_data?.amount_usd || '0')
        return bAmount - aAmount
      })
      .slice(0, 3)
      .map(alert => ({
        id: alert.id,
        severity: alert.severity,
        title: `${alert.trigger_data?.blockchain || 'Unknown'} ${
          (parseFloat(alert.trigger_data?.amount_usd || '0') / 1000000).toFixed(1)
        }M Movement`,
        timestamp: alert.created_at
      })) || []

    // Calculate market mood delta (simplified - would need historical data)
    const marketMoodDelta = 0 // Placeholder - would calculate from previous period

    const response = {
      window,
      marketMood: Math.round(marketMood),
      marketMoodDelta,
      volume24h,
      volumeDelta: Math.round(volumeDelta * 10) / 10,
      activeWhales,
      whalesDelta: Math.round(whalesDelta * 10) / 10,
      riskIndex: Math.max(0, Math.min(100, riskIndex)),
      topAlerts,
      refreshedAt: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Market summary error:', error)
    
    // Return fallback data structure on error
    const fallbackResponse = {
      window: '24h',
      marketMood: 50,
      marketMoodDelta: 0,
      volume24h: 0,
      volumeDelta: 0,
      activeWhales: 0,
      whalesDelta: 0,
      riskIndex: 50,
      topAlerts: [],
      refreshedAt: new Date().toISOString(),
      error: 'Data not available - using fallback values'
    }

    return new Response(
      JSON.stringify(fallbackResponse),
      { 
        status: 200, // Return 200 with fallback data instead of 500
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})