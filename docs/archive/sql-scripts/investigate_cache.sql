-- Investigate why app shows different data than database
-- Run this in Supabase SQL Editor

-- 1. Check if there are multiple user records
SELECT 'All user records:' as info;
SELECT * FROM public.users ORDER BY created_at DESC;

-- 2. Check specifically your user with different queries
SELECT 'Your user by user_id:' as info;
SELECT * FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

SELECT 'Your user by email:' as info;
SELECT * FROM public.users WHERE email = 'meghalrp@gmail.com';

-- 3. Check if there's data in users_metadata that might override
SELECT 'Users metadata for your user:' as info;
SELECT * FROM public.users_metadata WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 4. Check auth.users to see if user_id matches
SELECT 'Auth users:' as info;
SELECT id, email, created_at FROM auth.users WHERE email = 'meghalrp@gmail.com';

-- 5. Force another update with explicit commit
BEGIN;
UPDATE public.users 
SET plan = 'pro', subscription_status = 'active', updated_at = NOW()
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';
COMMIT;

-- 6. Final verification
SELECT 'After forced update:' as info;
SELECT user_id, email, plan, subscription_status, updated_at FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';