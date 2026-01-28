/**
 * Apply the fix migration to remove problematic triggers
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Applying fix migration...\n');

  try {
    // Read the migration file
    const migrationSQL = readFileSync(
      'supabase/migrations/20260128000001_fix_opportunity_id_triggers.sql',
      'utf-8'
    );

    console.log('Migration SQL:');
    console.log('---');
    console.log(migrationSQL);
    console.log('---\n');

    console.log('⚠️  This migration will:');
    console.log('  1. Drop ALL triggers on the opportunities table');
    console.log('  2. Drop problematic functions');
    console.log('  3. Verify no triggers remain\n');

    console.log('📝 Note: You need to run this SQL manually in Supabase SQL Editor');
    console.log('   Go to: https://supabase.com/dashboard/project/[your-project]/sql/new\n');

    console.log('✅ Migration file created at:');
    console.log('   supabase/migrations/20260128000001_fix_opportunity_id_triggers.sql\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

applyMigration();
