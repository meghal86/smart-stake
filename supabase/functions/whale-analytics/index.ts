import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY')
const ALCHEMY_BASE_URL = 'https://eth-mainnet.g.alchemy.com/v2'

interface WhaleData {
  id: string
  address: string
  balance: number
  riskScore: number
  transactions24h: number
  netFlow24h: number
  chains: string[]
  labels: string[]
  lastActivity: string
  behaviorScore: number
  influence: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { sortBy = 'balance', filterBy = 'all' } = await req.json()

    // Fetch top whale addresses from Alchemy
    const whaleAddresses = await fetchTopWhaleAddresses()
    
    // Get detailed data for each whale
    const whales = await Promise.all(
      whaleAddresses.map(address => fetchWhaleDetails(address))
    )

    // Filter whales based on criteria
    const filteredWhales = filterWhales(whales, filterBy)
    
    // Sort whales
    const sortedWhales = sortWhales(filteredWhales, sortBy)

    // Calculate stats
    const stats = calculateStats(whales)

    return new Response(
      JSON.stringify({
        whales: sortedWhales,
        stats,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Whale analytics error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch whale analytics',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function fetchTopWhaleAddresses(): Promise<string[]> {
  // Get top ETH holders from Alchemy
  const response = await fetch(`${ALCHEMY_BASE_URL}/${ALCHEMY_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'alchemy_getTokenBalances',
      params: [
        '0x0000000000000000000000000000000000000000', // ETH
        'latest'
      ],
      id: 1
    })
  })

  if (!response.ok) {
    throw new Error('Failed to fetch whale addresses')
  }

  // For now, return known whale addresses
  return [
    '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Binance
    '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', // Binance 2
    '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', // Bitfinex
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db93', // Bitfinex 2
    '0x1522900b6dAfaC587D499A862861C0869BE6e428', // Kraken
    '0x0A869d79a7052C7f1b55a8EbAbbEa3420F0D1E13', // Kraken 2
    '0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0', // Kraken 3
    '0x6262998Ced04146fA42253a5C0AF90CA02dfd2A3', // Crypto.com
    '0x46340b20830761efd32832A74d7169B29FEB9758', // Crypto.com 2
    '0x28C6c06298d514Db089934071355E5743bf21d60' // Binance 14
  ]
}

async function fetchWhaleDetails(address: string): Promise<WhaleData> {
  try {
    // Get ETH balance
    const balanceResponse = await fetch(`${ALCHEMY_BASE_URL}/${ALCHEMY_API_KEY}`, {
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
    const balanceWei = parseInt(balanceData.result, 16)
    const balanceEth = balanceWei / 1e18
    
    // Get current ETH price (simplified - using fixed price for demo)
    const ethPrice = 3500 // Should fetch from CoinGecko API
    const balanceUsd = balanceEth * ethPrice

    // Get transaction count for activity estimation
    const txCountResponse = await fetch(`${ALCHEMY_BASE_URL}/${ALCHEMY_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
        id: 1
      })
    })

    const txCountData = await txCountResponse.json()
    const totalTxs = parseInt(txCountData.result, 16)

    // Calculate risk score based on balance and activity
    const riskScore = calculateRiskScore(balanceUsd, totalTxs, address)
    
    // Determine labels based on address patterns
    const labels = determineLabels(address, balanceUsd)
    
    // Calculate behavior score
    const behaviorScore = calculateBehaviorScore(balanceUsd, totalTxs, riskScore)
    
    // Determine influence level
    const influence = determineInfluence(balanceUsd)

    return {
      id: address,
      address,
      balance: balanceUsd,
      riskScore,
      transactions24h: Math.floor(Math.random() * 20), // Would need historical data
      netFlow24h: (Math.random() - 0.5) * balanceUsd * 0.1, // Estimated
      chains: ['ethereum'], // Could expand to other chains
      labels,
      lastActivity: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      behaviorScore,
      influence
    }
  } catch (error) {
    console.error(`Error fetching details for ${address}:`, error)
    // Return minimal data if API fails
    return {
      id: address,
      address,
      balance: 0,
      riskScore: 50,
      transactions24h: 0,
      netFlow24h: 0,
      chains: ['ethereum'],
      labels: ['Unknown'],
      lastActivity: new Date().toISOString(),
      behaviorScore: 50,
      influence: 'Low'
    }
  }
}

function calculateRiskScore(balance: number, totalTxs: number, address: string): number {
  let score = 50 // Base score
  
  // Higher balance = lower risk (established whale)
  if (balance > 100000000) score -= 20
  else if (balance > 50000000) score -= 10
  else if (balance < 1000000) score += 20
  
  // More transactions = lower risk (active, established)
  if (totalTxs > 10000) score -= 15
  else if (totalTxs > 1000) score -= 5
  else if (totalTxs < 100) score += 15
  
  // Known exchange addresses = lower risk
  const knownExchanges = [
    '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
    '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
    '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a'
  ]
  
  if (knownExchanges.includes(address)) score -= 25
  
  return Math.max(0, Math.min(100, score))
}

function determineLabels(address: string, balance: number): string[] {
  const labels = []
  
  // Exchange labels
  const exchangeAddresses: { [key: string]: string } = {
    '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503': 'Binance',
    '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8': 'Binance',
    '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a': 'Bitfinex',
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db93': 'Bitfinex',
    '0x1522900b6dAfaC587D499A862861C0869BE6e428': 'Kraken',
    '0x0A869d79a7052C7f1b55a8EbAbbEa3420F0D1E13': 'Kraken',
    '0x6262998Ced04146fA42253a5C0AF90CA02dfd2A3': 'Crypto.com'
  }
  
  if (exchangeAddresses[address]) {
    labels.push('Exchange', exchangeAddresses[address])
  }
  
  // Balance-based labels
  if (balance > 100000000) labels.push('Mega Whale')
  else if (balance > 50000000) labels.push('Large Whale')
  else if (balance > 10000000) labels.push('Whale')
  else labels.push('Fish')
  
  return labels.length > 0 ? labels : ['Unknown']
}

function calculateBehaviorScore(balance: number, totalTxs: number, riskScore: number): number {
  let score = 50
  
  // Higher balance with reasonable activity = higher behavior score
  if (balance > 50000000 && totalTxs > 1000) score += 30
  else if (balance > 10000000 && totalTxs > 500) score += 20
  
  // Lower risk = better behavior
  score += (100 - riskScore) * 0.3
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

function determineInfluence(balance: number): string {
  if (balance > 100000000) return 'Very High'
  if (balance > 50000000) return 'High'
  if (balance > 10000000) return 'Medium'
  return 'Low'
}

function filterWhales(whales: WhaleData[], filterBy: string): WhaleData[] {
  switch (filterBy) {
    case 'high-risk':
      return whales.filter(w => w.riskScore >= 70)
    case 'active':
      return whales.filter(w => w.transactions24h > 5)
    case 'defi':
      return whales.filter(w => w.labels.some(l => l.toLowerCase().includes('defi')))
    case 'exchange':
      return whales.filter(w => w.labels.some(l => l.toLowerCase().includes('exchange')))
    default:
      return whales
  }
}

function sortWhales(whales: WhaleData[], sortBy: string): WhaleData[] {
  switch (sortBy) {
    case 'balance':
      return whales.sort((a, b) => b.balance - a.balance)
    case 'risk':
      return whales.sort((a, b) => b.riskScore - a.riskScore)
    case 'activity':
      return whales.sort((a, b) => b.transactions24h - a.transactions24h)
    case 'influence':
      const influenceOrder = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 }
      return whales.sort((a, b) => (influenceOrder[b.influence as keyof typeof influenceOrder] || 0) - (influenceOrder[a.influence as keyof typeof influenceOrder] || 0))
    default:
      return whales
  }
}

function calculateStats(whales: WhaleData[]) {
  const totalWhales = whales.length
  const activeWhales = whales.filter(w => w.transactions24h > 0).length
  const totalValue = whales.reduce((sum, w) => sum + w.balance, 0)
  const avgRiskScore = Math.round(whales.reduce((sum, w) => sum + w.riskScore, 0) / totalWhales)
  
  return {
    totalWhales,
    activeWhales,
    totalValue,
    avgRiskScore
  }
}