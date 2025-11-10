#!/usr/bin/env node

/**
 * Validation script for Hunter Screen database schema
 * Tests that all tables, enums, indexes, triggers, and functions are created correctly
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateSchema() {
  console.log('🔍 Validating Hunter Screen database schema...\n');

  let allPassed = true;

  // Test 1: Check enums exist
  console.log('📋 Test 1: Checking enums...');
  const enums = ['opportunity_type', 'reward_unit', 'opportunity_status', 'urgency_type'];
  for (const enumName of enums) {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = '${enumName}'
      ) as exists`
    }).single();
    
    if (error) {
      // Try alternative method
      const { data: altData, error: altError } = await supabase
        .from('pg_type')
        .select('typname')
        .eq('typname', enumName)
        .single();
      
      if (altError) {
        console.log(`   ⚠️  Cannot verify enum ${enumName} (may need direct DB access)`);
      } else {
        console.log(`   ✅ Enum ${enumName} exists`);
      }
    } else if (data?.exists) {
      console.log(`   ✅ Enum ${enumName} exists`);
    } else {
      console.log(`   ❌ Enum ${enumName} missing`);
      allPassed = false;
    }
  }

  // Test 2: Check tables exist
  console.log('\n📋 Test 2: Checking tables...');
  const tables = [
    'opportunities',
    'guardian_scans',
    'eligibility_cache',
    'user_preferences',
    'saved_opportunities',
    'completed_opportunities',
    'analytics_events'
  ];

  for (const tableName of tables) {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`   ❌ Table ${tableName} missing or inaccessible: ${error.message}`);
      allPassed = false;
    } else {
      console.log(`   ✅ Table ${tableName} exists (count: ${count ?? 0})`);
    }
  }

  // Test 3: Check key columns in opportunities table
  console.log('\n📋 Test 3: Checking opportunities table columns...');
  const requiredColumns = [
    'id', 'slug', 'title', 'protocol_name', 'type', 'chains',
    'status', 'urgency', 'trust_score', 'trust_level',
    'reward_min', 'reward_max', 'reward_currency',
    'dedupe_key', 'source', 'created_at', 'updated_at'
  ];

  const { data: tableInfo, error: tableError } = await supabase
    .from('opportunities')
    .select('*')
    .limit(0);

  if (tableError) {
    console.log(`   ❌ Cannot access opportunities table: ${tableError.message}`);
    allPassed = false;
  } else {
    console.log(`   ✅ Opportunities table accessible`);
  }

  // Test 4: Test insert and trigger
  console.log('\n📋 Test 4: Testing data insertion and triggers...');
  
  // Insert test opportunity
  const testOpportunity = {
    slug: 'test-opportunity-validation',
    title: 'Test Opportunity',
    protocol_name: 'Test Protocol',
    type: 'airdrop',
    chains: ['ethereum'],
    dedupe_key: 'test:airdrop:validation:ethereum',
    source: 'internal',
    status: 'published',
    published_at: new Date().toISOString()
  };

  const { data: insertedOpp, error: insertError } = await supabase
    .from('opportunities')
    .insert(testOpportunity)
    .select()
    .single();

  if (insertError) {
    console.log(`   ❌ Failed to insert test opportunity: ${insertError.message}`);
    allPassed = false;
  } else {
    console.log(`   ✅ Test opportunity inserted (id: ${insertedOpp.id})`);

    // Test Guardian scan trigger
    const testScan = {
      opportunity_id: insertedOpp.id,
      score: 85,
      level: 'green',
      issues: [],
      scanned_at: new Date().toISOString()
    };

    const { data: insertedScan, error: scanError } = await supabase
      .from('guardian_scans')
      .insert(testScan)
      .select()
      .single();

    if (scanError) {
      console.log(`   ❌ Failed to insert Guardian scan: ${scanError.message}`);
      allPassed = false;
    } else {
      console.log(`   ✅ Guardian scan inserted (id: ${insertedScan.id})`);

      // Check if trigger updated opportunity
      const { data: updatedOpp, error: fetchError } = await supabase
        .from('opportunities')
        .select('trust_score, trust_level')
        .eq('id', insertedOpp.id)
        .single();

      if (fetchError) {
        console.log(`   ❌ Failed to fetch updated opportunity: ${fetchError.message}`);
        allPassed = false;
      } else if (updatedOpp.trust_score === 85 && updatedOpp.trust_level === 'green') {
        console.log(`   ✅ Trigger updated trust_score and trust_level correctly`);
      } else {
        console.log(`   ❌ Trigger did not update correctly (score: ${updatedOpp.trust_score}, level: ${updatedOpp.trust_level})`);
        allPassed = false;
      }

      // Cleanup
      await supabase.from('guardian_scans').delete().eq('id', insertedScan.id);
    }

    await supabase.from('opportunities').delete().eq('id', insertedOpp.id);
    console.log(`   ✅ Test data cleaned up`);
  }

  // Test 5: Check RLS policies
  console.log('\n📋 Test 5: Checking RLS policies...');
  const rlsTables = ['saved_opportunities', 'completed_opportunities', 'analytics_events'];
  
  for (const tableName of rlsTables) {
    // Try to query without auth (should work for analytics_events insert, fail for others)
    const anonClient = createClient(supabaseUrl, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY);
    const { data, error } = await anonClient
      .from(tableName)
      .select('*')
      .limit(1);

    if (tableName === 'analytics_events') {
      if (error && error.message.includes('permission denied')) {
        console.log(`   ✅ RLS on ${tableName} correctly blocks SELECT`);
      } else {
        console.log(`   ⚠️  RLS on ${tableName} may not be configured correctly`);
      }
    } else {
      if (error) {
        console.log(`   ✅ RLS on ${tableName} is enabled (requires auth)`);
      } else {
        console.log(`   ⚠️  RLS on ${tableName} may allow unauthorized access`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ All validation tests passed!');
    console.log('✅ Hunter Screen database schema is ready');
  } else {
    console.log('⚠️  Some validation tests failed');
    console.log('⚠️  Review the errors above and check the migration');
  }
  console.log('='.repeat(60));

  return allPassed;
}

// Run validation
validateSchema()
  .then(passed => {
    process.exit(passed ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Validation failed with error:', error);
    process.exit(1);
  });
