-- Fix duplicate user records
-- Run this in Supabase SQL Editor

-- 1. Show current duplicates
SELECT 'Current duplicate records:' as info;
SELECT id, user_id, email, plan, created_at, updated_at 
FROM public.users 
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f'
ORDER BY created_at;

-- 2. Delete the older/incorrect record (the one with plan = 'free')
DELETE FROM public.users 
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f' 
AND plan = 'free';

-- 3. Ensure the remaining record is set to Pro
UPDATE public.users 
SET plan = 'pro', 
    subscription_status = 'active',
    updated_at = NOW()
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 4. Verify only one record remains with Pro plan
SELECT 'After cleanup:' as info;
SELECT id, user_id, email, plan, subscription_status, updated_at 
FROM public.users 
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';