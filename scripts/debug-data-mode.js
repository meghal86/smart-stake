#!/usr/bin/env node

// Debug why we're still seeing mock data

console.log('🔍 Debugging data mode...')
console.log('NEXT_PUBLIC_DATA_MODE:', process.env.NEXT_PUBLIC_DATA_MODE)

// Check if client adapters are working
const fs = require('fs')
const path = require('path')

// Check whaleSpotlight adapter
const spotlightPath = path.join(__dirname, '../src/lib/adapters/whaleSpotlight.ts')
if (fs.existsSync(spotlightPath)) {
  const content = fs.readFileSync(spotlightPath, 'utf8')
  console.log('\n📊 WhaleSpotlight adapter:')
  console.log('- Has NEXT_PUBLIC_DATA_MODE check:', content.includes('NEXT_PUBLIC_DATA_MODE'))
  console.log('- Points to /functions/v1/whale-spotlight:', content.includes('/functions/v1/whale-spotlight'))
}

// Check fearIndex adapter  
const fearPath = path.join(__dirname, '../src/lib/adapters/fearIndex.ts')
if (fs.existsSync(fearPath)) {
  const content = fs.readFileSync(fearPath, 'utf8')
  console.log('\n😨 FearIndex adapter:')
  console.log('- Has NEXT_PUBLIC_DATA_MODE check:', content.includes('NEXT_PUBLIC_DATA_MODE'))
  console.log('- Points to /functions/v1/fear-index:', content.includes('/functions/v1/fear-index'))
}

console.log('\n🎯 Next steps:')
console.log('1. Restart your dev server: npm run dev')
console.log('2. Check browser console for errors')
console.log('3. Look for "Real" vs "Simulated" provenance chips')
console.log('4. If still mock, the whale_transfers table might be empty')