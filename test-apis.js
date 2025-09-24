#!/usr/bin/env node

/**
 * Test Market Hub APIs
 */

const testMarketSummary = async () => {
  try {
    console.log('🔄 Testing market-summary API...');
    const response = await fetch('https://rebeznxivaxgserswhbn.supabase.co/functions/v1/market-summary', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
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
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
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
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
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