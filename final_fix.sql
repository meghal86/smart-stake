-- Final fix: Direct database update with all safeguards disabled
-- Run this in Supabase SQL Editor

-- 1. Show current state
SELECT 'CURRENT STATE:' as status;
SELECT user_id, email, plan, subscription_status, updated_at FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 2. Disable all triggers and constraints
ALTER TABLE public.users DISABLE TRIGGER ALL;
SET session_replication_role = replica;

-- 3. Direct update with explicit transaction
BEGIN;

UPDATE public.users 
SET 
  plan = 'pro',
  subscription_status = 'active',
  updated_at = NOW()
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- Check if update worked within transaction
SELECT 'WITHIN TRANSACTION:' as status;
SELECT user_id, email, plan, subscription_status, updated_at FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

COMMIT;

-- 4. Re-enable triggers
SET session_replication_role = DEFAULT;
ALTER TABLE public.users ENABLE TRIGGER ALL;

-- 5. Final verification
SELECT 'FINAL RESULT:' as status;
SELECT user_id, email, plan, subscription_status, updated_at FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 6. Test what the app would see
SELECT 'WHAT APP SEES:' as status;
SELECT plan FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';