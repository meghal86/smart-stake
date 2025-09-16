// Test blockchain data ingestion
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rebeznxivaxgserswhbn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo'
)

async function testIngestion() {
  console.log('Testing blockchain data ingestion...')
  
  try {
    // Call blockchain-monitor function
    const { data, error } = await supabase.functions.invoke('blockchain-monitor')
    
    if (error) {
      console.error('Function error:', error)
      return
    }
    
    console.log('Ingestion result:', data)
    
    // Check if data was inserted
    const { data: balances, error: balanceError } = await supabase
      .from('whale_balances')
      .select('*')
      .limit(5)
    
    console.log('Balances after ingestion:', balances?.length || 0)
    if (balances?.length > 0) {
      console.log('Sample balance:', balances[0])
    }
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testIngestion()