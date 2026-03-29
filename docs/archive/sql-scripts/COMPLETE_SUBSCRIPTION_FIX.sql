-- ============================================================================
-- COMPLETE SUBSCRIPTION SYSTEM FIX
-- This SQL script fixes all the issues preventing subscription upgrades from working
-- ============================================================================

-- 1. Fix the users table constraint to support 'pro' plan
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('free', 'pro', 'premium'));

-- 2. Create webhook_logs table for debugging
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('processing', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage webhook logs" ON public.webhook_logs
  FOR ALL USING (true);

-- 3. Create function to automatically create public.users records when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id, email, plan, created_at, updated_at)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'plan', 'free'),
    NOW(),
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to call the function when new users sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create any missing user records for existing auth users
-- (This will only work if you have service role access)
-- You may need to run this manually for your specific user ID

-- Example for creating a user record manually:
-- INSERT INTO public.users (user_id, email, plan, created_at, updated_at)
-- VALUES ('YOUR_USER_ID_HERE', 'your-email@example.com', 'free', NOW(), NOW())
-- ON CONFLICT (user_id) DO NOTHING;

-- 6. Verify the setup
SELECT 'Setup verification:' as info;
SELECT 'Users table constraint:' as check, 
       constraint_name, 
       check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'users_plan_check';

SELECT 'Webhook logs table:' as check, 
       table_name 
FROM information_schema.tables 
WHERE table_name = 'webhook_logs' AND table_schema = 'public';

SELECT 'User creation trigger:' as check, 
       trigger_name, 
       event_manipulation, 
       action_timing 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- NEXT STEPS AFTER RUNNING THIS SQL:
-- 
-- 1. Configure Stripe Webhook:
--    - Go to Stripe Dashboard > Webhooks
--    - Add endpoint: https://rebeznxivaxgserswhbn.supabase.co/functions/v1/stripe-webhook
--    - Enable events: customer.subscription.updated, checkout.session.completed
--    - Copy webhook secret to your .env file
--
-- 2. Redeploy webhook function:
--    - Run: supabase functions deploy stripe-webhook
--
-- 3. Test subscription upgrade:
--    - Sign up or log in to your app
--    - Go to subscription page
--    - Upgrade to Pro or Premium
--    - Check that plan updates automatically
--
-- ============================================================================