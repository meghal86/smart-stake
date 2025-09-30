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
    'user_preferences',
    'devices',
    'risk_scans',
    'yields'
  ];

  const results: HealthCheckResult[] = [];

  for (const table of tables) {
    try {
      // Try to query the table with a limit to check if it exists and is accessible
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

export const checkUserAccess = async (userId: string) => {
  try {
    // Check if user exists in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Check if user has metadata
    const { data: metadataData, error: metadataError } = await supabase
      .from('users_metadata')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Check if user has subscription
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    return {
      user: {
        exists: !userError,
        data: userData,
        error: userError?.message
      },
      metadata: {
        exists: !metadataError,
        data: metadataData,
        error: metadataError?.message
      },
      subscription: {
        exists: !subscriptionError,
        data: subscriptionData,
        error: subscriptionError?.message
      }
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};