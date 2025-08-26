import { supabase } from '@/integrations/supabase/client';

export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Database connection successful');
    return { success: true, data };
  } catch (err) {
    console.error('Database test failed:', err);
    return { success: false, error: err.message };
  }
};

export const checkTableExists = async (tableName: string) => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Table ${tableName} error:`, error);
      return false;
    }
    
    console.log(`Table ${tableName} exists`);
    return true;
  } catch (err) {
    console.error(`Table ${tableName} check failed:`, err);
    return false;
  }
};