/**
 * Test script to validate deployed Cockpit Edge Functions
 * 
 * This script tests both cockpit-summary and cockpit-actions-rendered functions
 * to ensure they're deployed and working correctly.
 */

// You'll need to replace these with your actual Supabase project details
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

// Test user auth token - you'll need to get this from your browser's dev tools
// or create a test user and get their JWT token
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'YOUR_AUTH_TOKEN';

async function testCockpitSummary() {
  console.log('🧪 Testing cockpit-summary function...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cockpit-summary?wallet_scope=active`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Response structure:', {
      hasData: !!data.data,
      hasError: !!data.error,
      hasMeta: !!data.meta,
      timestamp: data.meta?.ts,
    });

    if (data.data) {
      console.log('📋 Summary data:', {
        walletScope: data.data.wallet_scope,
        todayCardKind: data.data.today_card?.kind,
        actionPreviewCount: data.data.action_preview?.length || 0,
        counters: data.data.counters,
        providerStatus: data.data.provider_status?.state,
        degradedMode: data.data.degraded_mode,
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  }
}

async function testCockpitActionsRendered() {
  console.log('\n🧪 Testing cockpit-actions-rendered function...');
  
  try {
    const testPayload = {
      dedupe_keys: ['test:action1:Fix', 'test:action2:Execute']
    };

    const response = await fetch(`${SUPABASE_URL}/functions/v1/cockpit-actions-rendered`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(testPayload),
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Response structure:', {
      hasData: !!data.data,
      hasError: !!data.error,
      hasMeta: !!data.meta,
      timestamp: data.meta?.ts,
    });

    if (data.data) {
      console.log('📋 Actions rendered data:', {
        ok: data.data.ok,
        updatedCount: data.data.updated_count,
        totalCount: data.data.total_count,
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  }
}

async function testWithoutAuth() {
  console.log('\n🧪 Testing without authentication (should return 401)...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/cockpit-summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Correctly returns 401 for unauthenticated requests');
      return true;
    } else {
      console.log('⚠️  Expected 401 but got:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Validating Cockpit Edge Functions');
  console.log('=====================================');
  
  // Check environment variables
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.error('❌ Please set NEXT_PUBLIC_SUPABASE_URL environment variable');
    process.exit(1);
  }
  
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_ANON_KEY') {
    console.error('❌ Please set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
    process.exit(1);
  }
  
  if (!AUTH_TOKEN || AUTH_TOKEN === 'YOUR_AUTH_TOKEN') {
    console.error('❌ Please set TEST_AUTH_TOKEN environment variable');
    console.error('   You can get this from your browser dev tools after logging in');
    process.exit(1);
  }

  console.log(`🔗 Testing against: ${SUPABASE_URL}`);
  console.log(`🔑 Using auth token: ${AUTH_TOKEN.substring(0, 20)}...`);
  
  const results = [];
  
  // Test cockpit-summary
  results.push(await testCockpitSummary());
  
  // Test cockpit-actions-rendered
  results.push(await testCockpitActionsRendered());
  
  // Test authentication
  results.push(await testWithoutAuth());
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    console.log(`✅ All ${total} tests passed! Functions are working correctly.`);
  } else {
    console.log(`❌ ${total - passed} out of ${total} tests failed.`);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);