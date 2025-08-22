import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  table: string;
  exists: boolean;
  accessible: boolean;
  error?: string;
}

export const checkDatabaseHealth = async (): Promise<HealthCheckResult[]> => {
  const tables = [
    'users',
    'users_metadata', 
    'subscriptions',
    'alerts',
    'user_preferences'
  ];

  const results: HealthCheckResult[] = [];

  for (const table of tables) {
    try {
      // Try to query the table
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        results.push({
          table,
          exists: false,
          accessible: false,
          error: error.message
        });
      } else {
        results.push({
          table,
          exists: true,
          accessible: true
        });
      }
    } catch (err) {
      results.push({
        table,
        exists: false,
        accessible: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  return results;
};

export const logHealthCheck = async () => {
  console.log('🔍 Checking database health...');
  const results = await checkDatabaseHealth();
  
  results.forEach(result => {
    if (result.accessible) {
      console.log(`✅ ${result.table}: OK`);
    } else {
      console.error(`❌ ${result.table}: ${result.error}`);
    }
  });

  const allHealthy = results.every(r => r.accessible);
  
  if (allHealthy) {
    console.log('🎉 All database tables are healthy!');
  } else {
    console.error('⚠️  Some database tables have issues. Check the setup guide.');
  }

  return allHealthy;
};