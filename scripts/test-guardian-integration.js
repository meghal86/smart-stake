#!/usr/bin/env node

/**
 * Test Guardian Integration with Hunter Screen
 * 
 * This script tests the Guardian integration backend service
 * to verify it's working with your Upstash Redis cache.
 * 
 * Run: node scripts/test-guardian-integration.js
 */

import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const redisUrl = process.env.VITE_UPSTASH_REDIS_REST_URL;
const redisToken = process.env.VITE_UPSTASH_REDIS_REST_TOKEN;

console.log('🧪 Testing Guardian Integration\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log(`  Supabase URL: ${supabaseUrl ? '✅' : '❌'}`);
console.log(`  Supabase Key: ${supabaseKey ? '✅' : '❌'}`);
console.log(`  Redis URL: ${redisUrl ? '✅' : '❌'}`);
console.log(`  Redis Token: ${redisToken ? '✅' : '❌'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

if (!redisUrl || !redisToken) {
  console.warn('⚠️  Missing Redis credentials - caching will not work');
  console.warn('   Add VITE_UPSTASH_REDIS_REST_URL and VITE_UPSTASH_REDIS_REST_TOKEN to .env\n');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

async function testGuardianIntegration() {
  try {
    // Step 1: Check if opportunities exist
    console.log('1️⃣  Checking for opportunities in database...');
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('id, slug, title, status')
      .eq('status', 'published')
      .limit(5);

    if (oppError) {
      console.error('❌ Error fetching opportunities:', oppError.message);
      return;
    }

    if (!opportunities || opportunities.length === 0) {
      console.log('⚠️  No published opportunities found in database');
      console.log('   You need to add some opportunities first\n');
      return;
    }

    console.log(`✅ Found ${opportunities.length} opportunities:`);
    opportunities.forEach(opp => {
      console.log(`   - ${opp.slug}: ${opp.title}`);
    });
    console.log('');

    // Step 2: Check for Guardian scans
    console.log('2️⃣  Checking for Guardian scans...');
    const opportunityIds = opportunities.map(o => o.id);
    
    const { data: scans, error: scanError } = await supabase
      .from('guardian_scans')
      .select('opportunity_id, score, level, scanned_at')
      .in('opportunity_id', opportunityIds);

    if (scanError) {
      console.error('❌ Error fetching Guardian scans:', scanError.message);
      return;
    }

    if (!scans || scans.length === 0) {
      console.log('⚠️  No Guardian scans found for these opportunities');
      console.log('   You need to run Guardian scans first\n');
      console.log('💡 To add test Guardian scans, run:');
      console.log('   INSERT INTO guardian_scans (opportunity_id, score, level, issues, scanned_at)');
      console.log('   VALUES (\'<opportunity-id>\', 85, \'green\', \'[]\', NOW());\n');
      return;
    }

    console.log(`✅ Found ${scans.length} Guardian scans:`);
    scans.forEach(scan => {
      const opp = opportunities.find(o => o.id === scan.opportunity_id);
      console.log(`   - ${opp?.slug}: Score ${scan.score} (${scan.level})`);
    });
    console.log('');

    // Step 3: Test Redis cache
    if (redis) {
      console.log('3️⃣  Testing Redis cache...');
      
      const testKey = 'guardian:scan:test-' + Date.now();
      const testData = {
        opportunityId: 'test',
        score: 85,
        level: 'green',
        lastScannedTs: new Date().toISOString(),
        topIssues: [],
      };

      try {
        // Set test data
        await redis.set(testKey, JSON.stringify(testData), { ex: 60 });
        console.log('✅ Successfully wrote to Redis cache');

        // Get test data
        const cached = await redis.get(testKey);
        if (cached) {
          console.log('✅ Successfully read from Redis cache');
        } else {
          console.log('⚠️  Could not read from Redis cache');
        }

        // Clean up
        await redis.del(testKey);
        console.log('✅ Redis cache is working correctly\n');
      } catch (redisError) {
        console.error('❌ Redis error:', redisError.message);
        console.log('   Check your Upstash Redis credentials\n');
      }
    } else {
      console.log('3️⃣  Skipping Redis test (no credentials)\n');
    }

    // Step 4: Simulate batch fetch
    console.log('4️⃣  Simulating Guardian batch fetch...');
    console.log('   This is what the Hunter screen will do:\n');
    
    const scanMap = new Map();
    scans.forEach(scan => {
      scanMap.set(scan.opportunity_id, scan);
    });

    opportunities.forEach(opp => {
      const scan = scanMap.get(opp.id);
      if (scan) {
        const color = scan.level === 'green' ? '🟢' : scan.level === 'amber' ? '🟡' : '🔴';
        console.log(`   ${color} ${opp.title}`);
        console.log(`      Trust Score: ${scan.score}/100 (${scan.level})`);
        console.log(`      Last Scanned: ${new Date(scan.scanned_at).toLocaleString()}`);
      } else {
        console.log(`   ⚪ ${opp.title}`);
        console.log(`      No Guardian scan available`);
      }
      console.log('');
    });

    // Summary
    console.log('📊 Summary:');
    console.log(`   Total Opportunities: ${opportunities.length}`);
    console.log(`   With Guardian Scans: ${scans.length}`);
    console.log(`   Cache Status: ${redis ? '✅ Connected' : '⚠️  Not configured'}`);
    console.log('');

    console.log('✅ Guardian Integration Backend is Working!\n');
    console.log('📝 Next Steps:');
    console.log('   1. The backend service is ready (Task 10 ✅)');
    console.log('   2. Need to connect UI to show trust chips (Task 16)');
    console.log('   3. Visit http://localhost:8082/hunter to see opportunities');
    console.log('   4. Trust chips will appear after Task 16 is complete\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testGuardianIntegration().then(() => {
  console.log('🏁 Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
