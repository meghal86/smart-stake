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

    const url = new URL(req.url)
    const cursor = url.searchParams.get('cursor')
    const severity = url.searchParams.get('severity') || 'All'
    const minUsd = url.searchParams.get('minUsd')
    const chain = url.searchParams.get('chain') || 'All'
    const watchlistOnly = url.searchParams.get('watchlistOnly') === 'true'
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('alert_events')
      .select(`
        id,
        severity,
        trigger_data,
        reasons,
        cluster_id,
        created_at,
        score,
        is_read
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (severity !== 'All') {
      query = query.eq('severity', severity)
    }

    if (minUsd) {
      query = query.gte('trigger_data->>amount_usd', parseFloat(minUsd))
    }

    if (chain !== 'All') {
      query = query.eq('trigger_data->>blockchain', chain)
    }

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    // Execute query
    const { data: rawAlerts, error } = await query

    if (error) {
      throw error
    }

    // Process alerts through classification pipeline
    const processedAlerts = await Promise.all(
      (rawAlerts || []).map(async (alert) => {
        // Classify alert using behavioral clustering rules
        const cluster = await classifyAlert(alert, supabase)
        
        // Calculate impact score and confidence
        const { impactScore, confidence } = calculateAlertMetrics(alert)
        
        // Generate thread key for grouping similar alerts
        const threadKey = generateThreadKey(alert, cluster)
        
        return {
          id: alert.id,
          ts: alert.created_at,
          chain: alert.trigger_data?.blockchain || 'Unknown',
          token: alert.trigger_data?.token || 'Unknown',
          usd: parseFloat(alert.trigger_data?.amount_usd || '0'),
          cluster,
          severity: alert.severity,
          impactScore,
          confidence,
          reasons: alert.reasons || [],
          threadKey,
          isRead: alert.is_read || false,
          score: alert.score || 0
        }
      })
    )

    // Filter alerts based on minimum thresholds and behavioral evidence
    const filteredAlerts = processedAlerts.filter(alert => {
      // Get chain-adaptive thresholds
      const minAmount = getMinAmountThreshold(alert.chain)
      const highValue = getHighValueThreshold(alert.chain)
      
      // Keep if meets minimum threshold OR has behavioral evidence
      const meetsThreshold = alert.usd >= minAmount || alert.usd >= highValue
      const hasBehavioralEvidence = alert.cluster !== 'unknown' && alert.confidence > 0.3
      
      return meetsThreshold || hasBehavioralEvidence
    })

    // Group alerts by thread key for threading
    const threadedAlerts = groupAlertsByThread(filteredAlerts)

    // Calculate keep rate for telemetry
    const keepRate = rawAlerts?.length ? (filteredAlerts.length / rawAlerts.length) : 0

    const response = {
      alerts: threadedAlerts,
      cursor: filteredAlerts.length > 0 ? filteredAlerts[filteredAlerts.length - 1].ts : null,
      hasMore: filteredAlerts.length === limit,
      keepRate: Math.round(keepRate * 100),
      totalProcessed: rawAlerts?.length || 0,
      totalKept: filteredAlerts.length,
      filters: {
        severity,
        minUsd,
        chain,
        watchlistOnly
      }
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
    console.error('Alerts stream error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        alerts: [],
        cursor: null,
        hasMore: false
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

// Helper function to classify alerts using cluster rules
async function classifyAlert(alert: any, supabase: any): Promise<string> {
  const triggerData = alert.trigger_data || {}
  const amount = parseFloat(triggerData.amount_usd || '0')
  const blockchain = triggerData.blockchain || ''
  const fromEntity = (triggerData.from_entity || '').toLowerCase()
  const toEntity = (triggerData.to_entity || '').toLowerCase()
  const tags = triggerData.tags || []

  // CEX entities and DeFi tags
  const cexEntities = ['binance', 'okx', 'coinbase', 'kraken', 'bybit', 'kucoin']
  const defiTags = ['swap', 'lend', 'stake', 'bridge', 'yield', 'liquidity', 'perps']

  // Priority-based classification
  
  // 1. Dormant → Waking
  if (tags.includes('dormant_wake') || tags.includes('dormant')) {
    return 'DORMANT_WAKING'
  }
  
  // 2. CEX Inflow
  if (cexEntities.some(cex => toEntity.includes(cex)) && amount >= 100000) {
    return 'CEX_INFLOW'
  }
  
  // 3. DeFi Activity
  if (tags.some(tag => defiTags.includes(tag)) && amount >= 50000) {
    return 'DEFI_ACTIVITY'
  }
  
  // 4. Distribution (multiple recipients, not to CEX)
  if (amount >= 100000 && !cexEntities.some(cex => toEntity.includes(cex))) {
    return 'DISTRIBUTION'
  }
  
  // 5. Accumulation (default for large amounts)
  if (amount >= 100000) {
    return 'ACCUMULATION'
  }
  
  return 'unknown'
}

// Helper function to calculate alert metrics
function calculateAlertMetrics(alert: any): { impactScore: number; confidence: number } {
  const amount = parseFloat(alert.trigger_data?.amount_usd || '0')
  const severity = alert.severity || 'Info'
  
  // Impact score based on amount (log scale)
  const impactScore = Math.min(1.0, Math.log10(Math.max(amount, 1)) / 8) // Max at 100M
  
  // Confidence based on severity and data completeness
  let confidence = 0.5
  if (severity === 'High') confidence = 0.8
  else if (severity === 'Medium') confidence = 0.6
  
  // Boost confidence if we have entity information
  if (alert.trigger_data?.from_entity || alert.trigger_data?.to_entity) {
    confidence += 0.1
  }
  
  // Boost confidence if we have tags
  if (alert.trigger_data?.tags?.length > 0) {
    confidence += 0.1
  }
  
  return {
    impactScore: Math.round(impactScore * 100) / 100,
    confidence: Math.min(1.0, Math.round(confidence * 100) / 100)
  }
}

// Helper function to generate thread key for grouping
function generateThreadKey(alert: any, cluster: string): string {
  const blockchain = alert.trigger_data?.blockchain || 'unknown'
  const token = alert.trigger_data?.token || 'unknown'
  const direction = alert.trigger_data?.direction || 'unknown'
  const topEntity = alert.trigger_data?.to_entity || alert.trigger_data?.from_entity || 'unknown'
  
  // Create 15-minute bucket
  const timestamp = new Date(alert.created_at)
  const bucket15m = Math.floor(timestamp.getTime() / (15 * 60 * 1000))
  
  return `${cluster}:${blockchain}:${token}:${direction}:${bucket15m}:${topEntity}`
}

// Helper function to group alerts by thread
function groupAlertsByThread(alerts: any[]): any[] {
  const threads = new Map()
  
  alerts.forEach(alert => {
    const key = alert.threadKey
    if (!threads.has(key)) {
      threads.set(key, {
        ...alert,
        threadCount: 1,
        threadAlerts: [alert]
      })
    } else {
      const thread = threads.get(key)
      thread.threadCount++
      thread.threadAlerts.push(alert)
      // Use highest impact alert as representative
      if (alert.impactScore > thread.impactScore) {
        Object.assign(thread, alert)
        thread.threadCount = thread.threadAlerts.length
      }
    }
  })
  
  return Array.from(threads.values())
}

// Helper functions for thresholds (would come from chain_quantiles in production)
function getMinAmountThreshold(chain: string): number {
  const thresholds = {
    'BTC': 75000,
    'ETH': 50000,
    'SOL': 25000,
    'Others': 30000
  }
  return thresholds[chain as keyof typeof thresholds] || 50000
}

function getHighValueThreshold(chain: string): number {
  const thresholds = {
    'BTC': 250000,
    'ETH': 175000,
    'SOL': 85000,
    'Others': 100000
  }
  return thresholds[chain as keyof typeof thresholds] || 100000
}