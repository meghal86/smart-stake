// Refresh whale data and check results
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rebeznxivaxgserswhbn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo'
)

async function checkWhaleData() {
  console.log('Checking whale data...')
  
  // Check whale_balances
  const { data: balances } = await supabase
    .from('whale_balances')
    .select('address, balance, balance_usd, chain, provider')
    .order('balance_usd', { ascending: false })
    .limit(10)
  
  console.log(`Found ${balances?.length || 0} whale balances:`)
  balances?.forEach((whale, i) => {
    console.log(`${i+1}. ${whale.address.slice(0,10)}... - ${parseFloat(whale.balance).toFixed(2)} ETH ($${whale.balance_usd?.toLocaleString()})`)
  })
  
  // Check whale_signals
  const { data: signals } = await supabase
    .from('whale_signals')
    .select('*')
    .limit(5)
  
  console.log(`\nFound ${signals?.length || 0} whale signals`)
  
  // Check whale_transfers
  const { data: transfers } = await supabase
    .from('whale_transfers')
    .select('*')
    .limit(5)
  
  console.log(`Found ${transfers?.length || 0} whale transfers`)
}

checkWhaleData()