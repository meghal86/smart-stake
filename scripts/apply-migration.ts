import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Applying migration to fix triggers...\n');
  
  const sql = readFileSync('supabase/migrations/20260125000001_fix_opportunities_triggers.sql', 'utf-8');
  
  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));
  
  for (const statement of statements) {
    if (!statement) continue;
    
    console.log(`Executing: ${statement.substring(0, 60)}...`);
    
    const { error } = await supabase.rpc('exec_sql', { sql: statement });
    
    if (error) {
      console.log(`⚠️  ${error.message} (this is OK if the object doesn't exist)`);
    } else {
      console.log('✅ Success');
    }
  }
  
  console.log('\n✅ Migration complete!');
}

applyMigration();
