-- ============================================================================
-- IMMEDIATE SUBSCRIPTION FIX
-- Run this SQL in Supabase Dashboard > SQL Editor to fix your subscription issue
-- ============================================================================

-- 1. First, let's fix the plan constraint to allow 'premium'
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('free', 'pro', 'premium'));

-- 2. Create your user record manually (bypassing RLS)
-- Replace 'your-actual-email@example.com' with your real email
INSERT INTO public.users (user_id, email, plan, created_at, updated_at)
VALUES (
  '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f',
  'your-actual-email@example.com',  -- UPDATE THIS WITH YOUR REAL EMAIL
  'premium',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  plan = 'premium',
  updated_at = NOW();

-- 3. Create subscription record
INSERT INTO public.subscriptions (user_id, product_id, status, current_period_end, created_at, updated_at)
VALUES (
  '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f',
  'prod_premium',
  'active',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  current_period_end = NOW() + INTERVAL '30 days',
  updated_at = NOW();

-- 4. Add RLS policy for service role to manage webhook operations
CREATE POLICY "Service role can manage users" ON public.users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Verify the fix
SELECT 'User verification:' as check;
SELECT user_id, email, plan, created_at 
FROM public.users 
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

SELECT 'Subscription verification:' as check;
SELECT user_id, status, current_period_end 
FROM public.subscriptions 
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- ============================================================================
-- AFTER RUNNING THIS SQL:
-- 
-- 1. Your user record will exist with 'premium' plan
-- 2. Your subscription record will exist as 'active'
-- 3. When you log in to your app, you should see Premium plan
-- 4. Future webhook events will work correctly
-- 
-- IMPORTANT: Update the email address in the INSERT statement above!
-- ============================================================================