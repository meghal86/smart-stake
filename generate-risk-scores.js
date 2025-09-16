// Generate risk scores for existing whales
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rebeznxivaxgserswhbn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo'
)

// Risk scoring logic
function calculateRiskScore(balance, balanceUsd) {
  const balanceEth = parseFloat(balance)
  
  // Risk factors based on balance size and behavior patterns
  let riskScore = 50 // Base score
  let reasons = []
  
  // Large balance = higher risk (potential market impact)
  if (balanceUsd > 5000000000) { // > $5B
    riskScore += 25
    reasons.push(`Extremely large balance: $${(balanceUsd/1000000000).toFixed(1)}B`)
  } else if (balanceUsd > 1000000000) { // > $1B  
    riskScore += 15
    reasons.push(`Large balance: $${(balanceUsd/1000000000).toFixed(1)}B`)
  }
  
  // Exchange-like addresses (round numbers, high activity potential)
  if (balanceEth > 1000000) {
    riskScore += 10
    reasons.push(`High liquidity whale: ${(balanceEth/1000000).toFixed(1)}M ETH`)
  }
  
  // Zero balance = low risk
  if (balanceEth === 0) {
    riskScore = 15
    reasons = ['Inactive wallet with zero balance']
  }
  
  // Cap at 100
  riskScore = Math.min(100, riskScore)
  
  return { riskScore, reasons }
}

async function generateRiskScores() {
  console.log('Generating risk scores for whales...')
  
  // Get all whale balances
  const { data: whales } = await supabase
    .from('whale_balances')
    .select('address, chain, balance, balance_usd')
  
  if (!whales?.length) {
    console.log('No whales found')
    return
  }
  
  console.log(`Processing ${whales.length} whales...`)
  
  for (const whale of whales) {
    const { riskScore, reasons } = calculateRiskScore(whale.balance, whale.balance_usd)
    
    // Insert risk signal
    const { error } = await supabase
      .from('whale_signals')
      .insert({
        address: whale.address,
        chain: whale.chain,
        signal_type: 'risk_score',
        value: riskScore.toString(),
        confidence: 0.85,
        reasons: reasons,
        supporting_events: [],
        risk_score: riskScore,
        provider: 'whale-analytics',
        method: 'balance_risk_analysis'
      })
    
    if (error) {
      console.error(`Error for ${whale.address}:`, error.message)
    } else {
      console.log(`✓ ${whale.address.slice(0,10)}... - Risk: ${riskScore}/100`)
    }
  }
  
  console.log('Risk score generation complete!')
}

generateRiskScores()