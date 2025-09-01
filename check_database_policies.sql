-- Check for any database policies or views that might be interfering
-- Run this in Supabase SQL Editor

-- 1. Check RLS policies on users table
SELECT 'RLS Policies on users table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 2. Check if there are any views on users table
SELECT 'Views on users table:' as info;
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE table_schema = 'public' AND table_name LIKE '%user%';

-- 3. Check for any triggers on users table
SELECT 'Triggers on users table:' as info;
SELECT trigger_name, event_manipulation, action_statement, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'public';

-- 4. Test direct query as service role (bypassing RLS)
SELECT 'Direct query result:' as info;
SELECT user_id, email, plan, subscription_status, updated_at 
FROM public.users 
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 5. Check what the API would see (with RLS enabled)
SET ROLE authenticated;
SELECT 'With RLS (what API sees):' as info;
SELECT user_id, email, plan, subscription_status, updated_at 
FROM public.users 
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';
RESET ROLE;