#!/usr/bin/env node

// Validate existing functions work with live data mode

async function validateExistingFunctions() {
  console.log('🔍 Validating existing AlphaWhale functions...')
  
  const baseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
  
  const functions = [
    '/functions/v1/whale-spotlight',
    '/functions/v1/fear-index', 
    '/functions/v1/prices',
    '/functions/v1/healthz',
    '/functions/v1/data-ingestion'
  ]
  
  for (const func of functions) {
    try {
      const response = await fetch(`${baseUrl}${func}`)
      const status = response.ok ? '✅' : '❌'
      console.log(`${status} ${func} - ${response.status}`)
      
      if (response.ok && func !== '/functions/v1/data-ingestion') {
        const data = await response.json()
        if (data.provenance) {
          console.log(`   📊 Provenance: ${data.provenance}`)
        }
      }
    } catch (error) {
      console.log(`❌ ${func} - Error: ${error.message}`)
    }
  }
  
  console.log('\n🎯 Next steps:')
  console.log('1. Set NEXT_PUBLIC_DATA_MODE=live')
  console.log('2. Test data ingestion: POST /functions/v1/data-ingestion')
  console.log('3. Check health: GET /functions/v1/healthz')
}

validateExistingFunctions()