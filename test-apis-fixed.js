#!/usr/bin/env node

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo';

const testMarketSummary = async () => {
  try {
    console.log('🔄 Testing market-summary API...');
    const response = await fetch('https://rebeznxivaxgserswhbn.supabase.co/functions/v1/market-summary', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Market Summary Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Market Summary Error:', error.message);
  }
};

const testWhaleClusters = async () => {
  try {
    console.log('🔄 Testing whale-clusters API...');
    const response = await fetch('https://rebeznxivaxgserswhbn.supabase.co/functions/v1/whale-clusters', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Whale Clusters Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Whale Clusters Error:', error.message);
  }
};

const testAlertsStream = async () => {
  try {
    console.log('🔄 Testing alerts-stream API...');
    const response = await fetch('https://rebeznxivaxgserswhbn.supabase.co/functions/v1/alerts-stream', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filters: { severity: [], chains: [], minUsd: 0 },
        cursor: null,
        limit: 10
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Alerts Stream Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Alerts Stream Error:', error.message);
  }
};

const runTests = async () => {
  console.log('🧪 Testing Market Hub APIs...\n');
  
  await testMarketSummary();
  console.log('');
  
  await testWhaleClusters();
  console.log('');
  
  await testAlertsStream();
  console.log('');
  
  console.log('✅ API tests completed!');
};

runTests().catch(console.error);