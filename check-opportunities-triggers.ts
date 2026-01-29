/**
 * Check triggers on opportunities table
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  console.log('🔍 Checking triggers on opportunities table...\n');

  try {
    // Query pg_trigger to find triggers on opportunities table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          t.tgname AS trigger_name,
          p.proname AS function_name,
          pg_get_triggerdef(t.oid) AS trigger_definition
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        LEFT JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE c.relname = 'opportunities'
          AND n.nspname = 'public'
          AND NOT t.tgisinternal
        ORDER BY t.tgname;
      `
    });

    if (error) {
      console.error('❌ Error:', error);
      console.log('\n⚠️  Trying alternative method...\n');
      
      // Try direct query
      const query = `
        SELECT 
          trigger_name,
          event_manipulation,
          action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'opportunities'
          AND trigger_schema = 'public'
        ORDER BY trigger_name;
      `;
      
      console.log('Query:', query);
      return;
    }

    if (!data || data.length === 0) {
      console.log('✅ No triggers found on opportunities table');
      return;
    }

    console.log(`⚠️  Found ${data.length} trigger(s) on opportunities table:\n`);
    data.forEach((trigger: any) => {
      console.log(`Trigger: ${trigger.trigger_name}`);
      console.log(`Function: ${trigger.function_name}`);
      console.log(`Definition: ${trigger.trigger_definition}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

checkTriggers();
