/**
 * Comprehensive diagnosis of seed issue
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Diagnosing seed issue...\n');

  // 1. Check if opportunities table exists
  console.log('1️⃣ Checking if opportunities table exists...');
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accessing opportunities table:', error.message);
    } else {
      console.log('✅ Opportunities table exists');
    }
  } catch (e) {
    console.log('❌ Exception:', e);
  }

  // 2. Check existing opportunities count
  console.log('\n2️⃣ Checking existing opportunities...');
  try {
    const { count, error } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log(`✅ Found ${count} existing opportunities`);
    }
  } catch (e) {
    console.log('❌ Exception:', e);
  }

  // 3. Try to insert a minimal record
  console.log('\n3️⃣ Testing minimal insert...');
  try {
    const minimalRecord = {
      slug: 'test-minimal-' + Date.now(),
      title: 'Test Minimal',
      protocol: 'Test',
      protocol_name: 'Test',
      type: 'airdrop',
      chains: ['ethereum'],
      trust_score: 90,
      source: 'admin',
      source_ref: 'test-minimal-' + Date.now(),
      dedupe_key: 'admin:test-minimal-' + Date.now(),
      status: 'published',
    };

    const { data, error } = await supabase
      .from('opportunities')
      .insert(minimalRecord)
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', error.details);
      console.log('Error hint:', error.hint);
    } else {
      console.log('✅ Insert successful!');
      console.log('Inserted ID:', data[0]?.id);
      
      // Clean up
      await supabase
        .from('opportunities')
        .delete()
        .eq('id', data[0].id);
      console.log('✅ Cleaned up test record');
    }
  } catch (e: any) {
    console.log('❌ Exception:', e.message);
  }

  // 4. Check for airdrop-specific columns
  console.log('\n4️⃣ Checking airdrop-specific columns...');
  try {
    const testQuery = await supabase
      .from('opportunities')
      .select('snapshot_date, claim_start, claim_end, airdrop_category')
      .limit(1);
    
    if (testQuery.error) {
      console.log('❌ Airdrop columns not found:', testQuery.error.message);
    } else {
      console.log('✅ Airdrop columns exist');
    }
  } catch (e) {
    console.log('❌ Exception:', e);
  }

  // 5. Check user_airdrop_status table
  console.log('\n5️⃣ Checking user_airdrop_status table...');
  try {
    const { data, error } = await supabase
      .from('user_airdrop_status')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ user_airdrop_status table not found:', error.message);
    } else {
      console.log('✅ user_airdrop_status table exists');
    }
  } catch (e) {
    console.log('❌ Exception:', e);
  }

  console.log('\n✅ Diagnosis complete');
}

diagnose();
