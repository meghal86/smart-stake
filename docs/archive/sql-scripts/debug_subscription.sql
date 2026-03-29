-- Debug subscription status
-- Run this in your Supabase SQL editor to check and fix your subscription

-- 1. Check current user data
SELECT 'Current user data:' as info;
SELECT user_id, email, plan, subscription_status, stripe_customer_id, stripe_subscription_id 
FROM public.users 
ORDER BY created_at DESC;

-- 2. Check subscription data (first check what columns exist)
SELECT 'Subscription table columns:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'subscriptions' AND table_schema = 'public';

SELECT 'Subscription data:' as info;
SELECT * FROM public.subscriptions ORDER BY created_at DESC LIMIT 5;

-- 3. Check users_metadata (first check what columns exist)
SELECT 'Users_metadata table columns:' as info;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users_metadata' AND table_schema = 'public';

SELECT 'Users metadata:' as info;
SELECT * FROM public.users_metadata ORDER BY created_at DESC LIMIT 5;

-- 4. Check table structure first
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';

-- 5. Check current user data before update
SELECT * FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 6. MANUAL FIX: Update your specific user to Pro plan
UPDATE public.users 
SET plan = 'pro', 
    subscription_status = 'active',
    updated_at = NOW()
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 7. Verify the update worked
SELECT * FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 5. Check webhook logs (if available)
-- This would show in your Supabase Edge Function logs