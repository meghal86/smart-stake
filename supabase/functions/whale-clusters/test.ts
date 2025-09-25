// Test script for whale clustering
// Run with: deno run --allow-net --allow-env test.ts

const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

async function testWhaleClustering() {
  try {
    console.log('Testing whale clustering endpoint...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/whale-clusters`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chain: 'ETH',
        window: '24h'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Whale clusters response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    if (Array.isArray(data)) {
      console.log(`✅ Received ${data.length} clusters`);
      
      data.forEach((cluster, i) => {
        console.log(`Cluster ${i + 1}:`);
        console.log(`  Type: ${cluster.type}`);
        console.log(`  Name: ${cluster.name}`);
        console.log(`  Members: ${cluster.membersCount}`);
        console.log(`  Balance: $${(cluster.sumBalanceUsd / 1000000).toFixed(1)}M`);
        console.log(`  Risk Score: ${cluster.riskScore}`);
        console.log(`  Confidence: ${(cluster.confidence * 100).toFixed(1)}%`);
        console.log('');
      });
    } else {
      console.error('❌ Expected array response, got:', typeof data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

if (import.meta.main) {
  testWhaleClustering();
}