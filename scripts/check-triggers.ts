import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  console.log('🔍 Checking triggers on opportunities table...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        tgname AS trigger_name,
        proname AS function_name,
        pg_get_triggerdef(t.oid) AS trigger_definition
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE c.relname = 'opportunities'
      AND NOT t.tgisinternal;
    `
  });
  
  if (error) {
    console.error('❌ Error:', error.message);
    
    // Try alternative query
    console.log('\nTrying alternative query...\n');
    const { data: data2, error: error2 } = await supabase
      .from('pg_trigger')
      .select('*')
      .limit(5);
    
    if (error2) {
      console.error('❌ Alternative query also failed:', error2.message);
    } else {
      console.log('Sample triggers:', JSON.stringify(data2, null, 2));
    }
  } else {
    console.log('✅ Triggers found:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkTriggers();
