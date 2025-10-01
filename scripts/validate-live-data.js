#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function validateLiveData() {
  console.log('🔍 Validating live data integration...')
  
  try {
    // Check database schema
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'events_whale')
    
    if (!tables?.length) {
      throw new Error('events_whale table not found')
    }
    console.log('✅ Database schema validated')
    
    // Check data freshness
    const { data: freshness } = await supabase
      .from('data_freshness')
      .select('*')
      .single()
    
    console.log(`📊 Data age: ${freshness?.age_seconds || 'unknown'}s`)
    
    // Check functions
    const endpoints = [
      '/functions/v1/whale-spotlight',
      '/functions/v1/fear-index',
      '/functions/v1/prices'
    ]
    
    for (const endpoint of endpoints) {
      const response = await fetch(`${process.env.SUPABASE_URL}${endpoint}`)
      if (!response.ok) {
        throw new Error(`${endpoint} failed: ${response.status}`)
      }
      console.log(`✅ ${endpoint} working`)
    }
    
    // Check health endpoint
    const healthResponse = await fetch(`${process.env.APP_URL}/api/healthz`)
    const health = await healthResponse.json()
    
    console.log(`🏥 Health status: ${health.status}`)
    console.log(`🔄 Provenance: ${health.provenance}`)
    
    console.log('🎉 Live data integration validated successfully!')
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message)
    process.exit(1)
  }
}

validateLiveData()