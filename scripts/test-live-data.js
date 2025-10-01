#!/usr/bin/env node

// Quick test to see if live data is working

async function testLiveData() {
  console.log('🔍 Testing live data mode...')
  console.log('Environment:', process.env.NEXT_PUBLIC_DATA_MODE)
  
  const baseUrl = 'https://rebeznxivaxgserswhbn.supabase.co'
  
  try {
    // Test whale-spotlight
    console.log('\n📊 Testing whale-spotlight...')
    const spotlightRes = await fetch(`${baseUrl}/functions/v1/whale-spotlight`)
    const spotlight = await spotlightRes.json()
    console.log('Provenance:', spotlight.provenance)
    console.log('Largest move:', spotlight.largest_move_usd)
    
    // Test fear-index
    console.log('\n😨 Testing fear-index...')
    const fearRes = await fetch(`${baseUrl}/functions/v1/fear-index`)
    const fear = await fearRes.json()
    console.log('Provenance:', fear.provenance)
    console.log('Score:', fear.score)
    
    // Test data ingestion
    console.log('\n⚡ Testing data ingestion...')
    const ingestRes = await fetch(`${baseUrl}/functions/v1/data-ingestion`, { method: 'POST' })
    const ingest = await ingestRes.json()
    console.log('Ingestion result:', ingest)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testLiveData()