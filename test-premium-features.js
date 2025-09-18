// Test Premium Features
const SUPABASE_URL = 'https://rebeznxivaxgserswhbn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo'

async function testMarketMakerSentinel() {
  console.log('🔍 Testing Market Maker Sentinel...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/market-maker-sentinel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    console.log('✅ Market Maker Sentinel Response:', data)
  } catch (error) {
    console.error('❌ Market Maker Sentinel Error:', error)
  }
}

async function testNFTWhaleTracker() {
  console.log('🖼️ Testing NFT Whale Tracker...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/nft-whale-tracker`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    console.log('✅ NFT Whale Tracker Response:', data)
  } catch (error) {
    console.error('❌ NFT Whale Tracker Error:', error)
  }
}

async function testMultiChannelAlerts() {
  console.log('📧 Testing Multi-Channel Alerts...')
  
  const testAlert = {
    alert: {
      token: 'ETH',
      amount_usd: 2500000,
      from_addr: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
      to_addr: '0x4f3a120E72C76c22ae802D129F599BFDbc31cb81',
      chain: 'ethereum',
      timestamp: new Date().toISOString()
    },
    user_id: 'test-user-123'
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/multi-channel-alerts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testAlert)
    })
    
    const data = await response.json()
    console.log('✅ Multi-Channel Alerts Response:', data)
  } catch (error) {
    console.error('❌ Multi-Channel Alerts Error:', error)
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Testing Premium Features...\n')
  
  await testMarketMakerSentinel()
  console.log('')
  
  await testNFTWhaleTracker()
  console.log('')
  
  await testMultiChannelAlerts()
  console.log('')
  
  console.log('✅ All tests completed!')
}

runTests()