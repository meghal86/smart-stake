-- Simple direct fix for your Pro plan
-- Run this in Supabase SQL Editor

-- First, disable RLS temporarily to ensure the update works
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Update your plan to Pro
UPDATE public.users 
SET plan = 'pro'
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- Verify the update
SELECT user_id, email, plan, subscription_status 
FROM public.users 
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Final verification
SELECT 'Final result:' as info, user_id, email, plan, subscription_status 
FROM public.users 
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';