-- Final update to Pro plan (should stick now that we fixed the code)
-- Run this in Supabase SQL Editor

-- Update users table
UPDATE public.users 
SET plan = 'pro', 
    subscription_status = 'active',
    updated_at = NOW()
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- Update users_metadata table too (in case the app reads from here)
UPDATE public.users_metadata 
SET subscription = jsonb_set(
  COALESCE(subscription, '{}'),
  '{plan}',
  '"pro"'
)
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- Verify both updates
SELECT 'Users table:' as source, user_id, plan, subscription_status FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';
SELECT 'Metadata table:' as source, user_id, subscription FROM public.users_metadata WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';