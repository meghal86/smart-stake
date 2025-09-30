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
  } catch (error) {
    console.error('Database test failed:', error);
    return { success: false, error: error.message };
  }
};

export const createUserIfNotExists = async (userId: string, email: string) => {
  try {
    // First check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id, plan')
      .eq('user_id', userId)
      .single();

    if (existingUser) {
      // User exists, don't override their plan
      console.log('User already exists with plan:', existingUser.plan);
      return { success: true };
    }

    // User doesn't exist, create with default plan
    const { error } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        email: email,
        plan: 'free',
        onboarding_completed: false,
      });

    if (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('User creation failed:', error);
    return { success: false, error: error.message };
  }
};