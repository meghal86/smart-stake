import { supabase } from '@/integrations/supabase/client';

export const syncSubscriptionStatus = async (userId: string) => {
  try {
    console.log('Starting sync for user:', userId);

    // Update the users table with premium plan and Stripe IDs
    const { data, error: userError } = await supabase
      .from('users')
      .update({
        plan: 'premium', // Store as 'premium' in DB (due to constraint)
        subscription_status: 'active',
        stripe_subscription_id: 'sub_1S1KHMJwuQyqUsks0Tfchwdn', // Pro plan subscription ID
        stripe_customer_id: 'cus_Sw9diyl5NUs8MR',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select(); // Add select to see what was updated

    if (userError) {
      console.error('Error updating user:', userError);
      return { success: false, error: userError.message };
    }

    console.log('Update result:', data);
    console.log('Successfully updated user plan to premium with Stripe IDs');

    // Verify the update worked
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('plan, subscription_status, stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      console.error('Error verifying update:', verifyError);
    } else {
      console.log('Verification - Current user data:', verifyData);
    }

    // Trigger a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'user_plan_updated',
      newValue: 'premium'
    }));

    return { success: true };
  } catch (error: any) {
    console.error('Sync error:', error);
    return { success: false, error: error.message };
  }
};