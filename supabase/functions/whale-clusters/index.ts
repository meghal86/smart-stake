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

    const { window = '24h', clusterId = null } = await req.json()
    const windowMs = window === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
    const windowStart = new Date(Date.now() - windowMs).toISOString()

    // Get chain-adaptive thresholds (simplified - would come from chain_quantiles table)
    const getThresholds = (chain: string) => ({
      MIN_AMOUNT: Math.max(50000, 50000), // q70_usd(chain) fallback
      HIGH_VALUE: Math.max(100000, 100000), // q85_usd(chain) fallback
      DEFI_THRESHOLD: Math.max(50000, 50000), // q80_defi_usd(chain) fallback
      NET_OUT_THRESHOLD: Math.max(100000, 100000), // q80_netOut(chain) fallback
      NET_IN_THRESHOLD: Math.max(100000, 100000) // q80_netIn(chain) fallback
    })

    // Get whale balances
    const { data: whaleBalances } = await supabase
      .from('whale_balances')
      .select('address, balance_usd, chain')

    // Get whale signals for risk scoring
    const { data: whaleSignals } = await supabase
      .from('whale_signals')
      .select('address, risk_score, reasons')

    // Get whale transfers for behavioral analysis
    const { data: whaleTransfers } = await supabase
      .from('whale_transfers')
      .select('*')
      .gte('ts', windowStart)

    if (!whaleBalances?.length) {
      return new Response(
        JSON.stringify([]),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Behavioral clustering constants
    const CEX_ENTITIES = ['binance', 'okx', 'coinbase', 'kraken', 'bybit', 'kucoin']
    const DEFI_TAGS = ['swap', 'lend', 'stake', 'bridge', 'yield', 'liquidity', 'perps']
    const DEFI_COUNTERPARTY_TYPES = ['amm', 'lending', 'bridge', 'perps']
    const DORMANT_DAYS = 30
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000

    // Initialize cluster groups
    const clusterGroups: { [key: string]: any[] } = {
      DORMANT_WAKING: [],
      CEX_INFLOW: [],
      DEFI_ACTIVITY: [],
      DISTRIBUTION: [],
      ACCUMULATION: []
    }

    // Process each whale
    whaleBalances.forEach(whale => {
      const signal = whaleSignals?.find(s => s.address === whale.address)
      const thresholds = getThresholds(whale.chain)
      
      // Get relevant transfers for this whale
      const relevantTxs = whaleTransfers?.filter(tx => 
        tx.from_address === whale.address || tx.to_address === whale.address
      ) || []

      // Calculate behavioral metrics
      let dormantDays = 999
      let firstTxUsd = 0
      let usdToCex = 0
      let usdDefi = 0
      let netFlow = 0
      let uniqueRecipients = new Set()
      let toCexRatio = 0

      if (relevantTxs.length > 0) {
        const lastTxTime = Math.max(...relevantTxs.map(tx => new Date(tx.ts).getTime()))
        dormantDays = (now - lastTxTime) / dayMs

        // Find first transaction in window
        const firstTx = relevantTxs.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())[0]
        firstTxUsd = parseFloat(firstTx?.value_usd || '0')

        relevantTxs.forEach(tx => {
          const amount = parseFloat(tx.value_usd || '0')
          const isIncoming = tx.to_address === whale.address
          const isOutgoing = tx.from_address === whale.address
          
          if (isIncoming) {
            netFlow += amount
          } else if (isOutgoing) {
            netFlow -= amount
            uniqueRecipients.add(tx.to_address)
            
            // Check if going to CEX
            const toEntity = (tx.to_entity || '').toLowerCase()
            if (CEX_ENTITIES.some(cex => toEntity.includes(cex))) {
              usdToCex += amount
            }
          }

          // Check DeFi activity
          const tags = tx.tags || []
          const counterpartyType = tx.counterparty_type || ''
          if (
            tags.some(tag => DEFI_TAGS.includes(tag)) ||
            DEFI_COUNTERPARTY_TYPES.includes(counterpartyType)
          ) {
            usdDefi += amount
          }
        })

        const totalOutflow = relevantTxs
          .filter(tx => tx.from_address === whale.address)
          .reduce((sum, tx) => sum + parseFloat(tx.value_usd || '0'), 0)
        
        toCexRatio = totalOutflow > 0 ? usdToCex / totalOutflow : 0
      }

      // Behavioral classification (priority order - stop at first match)
      let clusterType = 'ACCUMULATION' // Default fallback
      let confidence = 0.5

      // 1) Dormant→Waking (highest priority)
      if (dormantDays >= DORMANT_DAYS && firstTxUsd >= thresholds.MIN_AMOUNT) {
        clusterType = 'DORMANT_WAKING'
        confidence = 0.9
      }
      // 2) CEX Inflow
      else if (usdToCex >= thresholds.HIGH_VALUE) {
        clusterType = 'CEX_INFLOW'
        confidence = 0.8
      }
      // 3) DeFi Activity
      else if (usdDefi >= Math.max(thresholds.DEFI_THRESHOLD, 50000)) {
        clusterType = 'DEFI_ACTIVITY'
        confidence = 0.7
      }
      // 4) Distribution
      else if (
        netFlow < -thresholds.NET_OUT_THRESHOLD &&
        toCexRatio < 0.5 &&
        uniqueRecipients.size >= 3
      ) {
        clusterType = 'DISTRIBUTION'
        confidence = 0.8
      }
      // 5) Accumulation (includes low confidence cases)
      else if (netFlow >= thresholds.NET_IN_THRESHOLD) {
        clusterType = 'ACCUMULATION'
        confidence = 0.7
      } else {
        // Low confidence accumulation
        clusterType = 'ACCUMULATION'
        confidence = 0.3
      }

      // Add to cluster group
      clusterGroups[clusterType].push({
        address: whale.address,
        balanceUsd: whale.balance_usd,
        chain: whale.chain,
        riskScore: signal?.risk_score || 50,
        reasonCodes: signal?.reasons || [],
        netFlow,
        confidence,
        lastActivityTs: relevantTxs.length > 0 ? 
          new Date(Math.max(...relevantTxs.map(tx => new Date(tx.ts).getTime()))).toISOString() :
          new Date(now - (dormantDays * dayMs)).toISOString(),
        metrics: {
          dormantDays,
          firstTxUsd,
          usdToCex,
          usdDefi,
          uniqueRecipients: uniqueRecipients.size,
          toCexRatio
        }
      })
    })

    // Build cluster response
    const clusterNames = {
      DORMANT_WAKING: 'Dormant → Waking',
      CEX_INFLOW: 'CEX Inflow',
      DEFI_ACTIVITY: 'DeFi Activity',
      DISTRIBUTION: 'Distribution',
      ACCUMULATION: 'Accumulation'
    }

    const clusters = Object.entries(clusterGroups).map(([type, members]) => {
      // Calculate risk skew (how much risk deviates from neutral 50)
      const avgRisk = members.length > 0 ? 
        members.reduce((sum, m) => sum + m.riskScore, 0) / members.length : 50
      const riskSkew = Math.abs(avgRisk - 50)

      return {
        id: type.toLowerCase().replace('_', '-'),
        type,
        name: clusterNames[type as keyof typeof clusterNames],
        membersCount: members.length,
        sumBalanceUsd: members.reduce((sum, m) => sum + m.balanceUsd, 0),
        netFlow24h: members.reduce((sum, m) => sum + m.netFlow, 0),
        riskScore: Math.round(avgRisk),
        riskSkew: Math.round(riskSkew),
        avgConfidence: members.length > 0 ? 
          members.reduce((sum, m) => sum + m.confidence, 0) / members.length : 0,
        members: members.map(m => ({
          address: m.address,
          balanceUsd: m.balanceUsd,
          riskScore: m.riskScore,
          reasonCodes: m.reasonCodes.slice(0, 3), // Limit to top 3
          lastActivityTs: m.lastActivityTs,
          confidence: m.confidence
        }))
      }
    })

    // If specific cluster requested, return detailed view
    if (clusterId) {
      const cluster = clusters.find(c => c.id === clusterId)
      if (cluster) {
        return new Response(
          JSON.stringify(cluster),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
    }

    // Return all clusters, sorted by priority order
    const priorityOrder = ['DORMANT_WAKING', 'CEX_INFLOW', 'DEFI_ACTIVITY', 'DISTRIBUTION', 'ACCUMULATION']
    const sortedClusters = clusters.sort((a, b) => 
      priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type)
    )

    return new Response(
      JSON.stringify(sortedClusters),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Whale clusters error:', error)
    
    // Return empty clusters on error
    const fallbackClusters = [
      {
        id: 'dormant-waking',
        type: 'DORMANT_WAKING',
        name: 'Dormant → Waking',
        membersCount: 0,
        sumBalanceUsd: 0,
        netFlow24h: 0,
        riskScore: 50,
        riskSkew: 0,
        members: []
      },
      {
        id: 'cex-inflow',
        type: 'CEX_INFLOW',
        name: 'CEX Inflow',
        membersCount: 0,
        sumBalanceUsd: 0,
        netFlow24h: 0,
        riskScore: 50,
        riskSkew: 0,
        members: []
      },
      {
        id: 'defi-activity',
        type: 'DEFI_ACTIVITY',
        name: 'DeFi Activity',
        membersCount: 0,
        sumBalanceUsd: 0,
        netFlow24h: 0,
        riskScore: 50,
        riskSkew: 0,
        members: []
      },
      {
        id: 'distribution',
        type: 'DISTRIBUTION',
        name: 'Distribution',
        membersCount: 0,
        sumBalanceUsd: 0,
        netFlow24h: 0,
        riskScore: 50,
        riskSkew: 0,
        members: []
      },
      {
        id: 'accumulation',
        type: 'ACCUMULATION',
        name: 'Accumulation',
        membersCount: 0,
        sumBalanceUsd: 0,
        netFlow24h: 0,
        riskScore: 50,
        riskSkew: 0,
        members: []
      }
    ]

    return new Response(
      JSON.stringify(fallbackClusters),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})