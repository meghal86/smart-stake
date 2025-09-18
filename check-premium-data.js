// Check Premium Features Database Data
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rebeznxivaxgserswhbn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo'
)

async function checkTables() {
  console.log('🔍 Checking Premium Features Database...\n')

  // Check Market Maker Addresses
  try {
    const { data: mmAddresses, error } = await supabase
      .from('market_maker_addresses')
      .select('*')
      .limit(5)
    
    console.log('📊 Market Maker Addresses:', mmAddresses?.length || 0, 'records')
    if (mmAddresses?.length > 0) {
      console.log('Sample:', mmAddresses[0])
    }
  } catch (error) {
    console.log('❌ Market Maker Addresses table error:', error.message)
  }

  console.log('')

  // Check NFT Collections
  try {
    const { data: nftCollections, error } = await supabase
      .from('nft_collections')
      .select('*')
      .limit(5)
    
    console.log('🖼️ NFT Collections:', nftCollections?.length || 0, 'records')
    if (nftCollections?.length > 0) {
      console.log('Sample:', nftCollections[0])
    }
  } catch (error) {
    console.log('❌ NFT Collections table error:', error.message)
  }

  console.log('')

  // Check Alert Templates
  try {
    const { data: alertTemplates, error } = await supabase
      .from('alert_templates')
      .select('*')
      .limit(5)
    
    console.log('📧 Alert Templates:', alertTemplates?.length || 0, 'records')
    if (alertTemplates?.length > 0) {
      console.log('Sample:', alertTemplates[0])
    }
  } catch (error) {
    console.log('❌ Alert Templates table error:', error.message)
  }

  console.log('')

  // Check Market Maker Flows
  try {
    const { data: mmFlows, error } = await supabase
      .from('market_maker_flows')
      .select('*')
      .limit(5)
    
    console.log('💰 Market Maker Flows:', mmFlows?.length || 0, 'records')
    if (mmFlows?.length > 0) {
      console.log('Sample:', mmFlows[0])
    }
  } catch (error) {
    console.log('❌ Market Maker Flows table error:', error.message)
  }

  console.log('')

  // Check NFT Whale Transactions
  try {
    const { data: nftTxs, error } = await supabase
      .from('nft_whale_transactions')
      .select('*')
      .limit(5)
    
    console.log('🐋 NFT Whale Transactions:', nftTxs?.length || 0, 'records')
    if (nftTxs?.length > 0) {
      console.log('Sample:', nftTxs[0])
    }
  } catch (error) {
    console.log('❌ NFT Whale Transactions table error:', error.message)
  }

  console.log('\n✅ Database check completed!')
}

checkTables()