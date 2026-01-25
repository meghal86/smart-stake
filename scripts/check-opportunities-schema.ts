import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking opportunities table schema...\n');
  
  // Try to query the table
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error querying opportunities table:', error.message);
    console.log('\n💡 The opportunities table might not exist yet.');
    console.log('   Run the migration: supabase/migrations/20260125000000_hunter_demand_side_shared_schema.sql');
  } else {
    console.log('✅ Opportunities table exists');
    console.log('📊 Sample row:', JSON.stringify(data, null, 2));
  }
}

checkSchema();
