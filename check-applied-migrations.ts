/**
 * Check which migrations have been applied to the database
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigrations() {
  console.log('🔍 Checking applied migrations...\n');

  try {
    // Query the schema_migrations table
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .order('version', { ascending: true });

    if (error) {
      console.error('❌ Error querying migrations:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No migrations found in schema_migrations table');
      return;
    }

    console.log(`✅ Found ${data.length} applied migrations:\n`);
    data.forEach((row) => {
      console.log(`  - ${row.version}`);
    });

    // Check for Hunter-related migrations
    console.log('\n📋 Hunter-related migrations:');
    const hunterMigrations = data.filter((row) => 
      row.version.includes('hunter') || 
      row.version >= '20260125000000'
    );
    
    if (hunterMigrations.length > 0) {
      hunterMigrations.forEach((row) => {
        console.log(`  ✓ ${row.version}`);
      });
    } else {
      console.log('  ⚠️  No Hunter migrations found');
    }

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

checkMigrations();
