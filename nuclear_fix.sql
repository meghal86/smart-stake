-- Nuclear option: Force update with all safeguards disabled
-- Run this in Supabase SQL Editor

-- 1. Show current state
SELECT 'BEFORE:' as status, id, user_id, email, plan, subscription_status FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 2. Disable ALL constraints and triggers
SET session_replication_role = replica;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE TRIGGER ALL;

-- 3. Delete ALL records for this user
DELETE FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 4. Insert a fresh Pro record
INSERT INTO public.users (
  user_id, 
  email, 
  plan, 
  subscription_status,
  onboarding_completed,
  created_at,
  updated_at
) VALUES (
  '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f',
  'meghalrp@gmail.com',
  'pro',
  'active',
  false,
  NOW(),
  NOW()
);

-- 5. Re-enable everything
ALTER TABLE public.users ENABLE TRIGGER ALL;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
SET session_replication_role = DEFAULT;

-- 6. Verify the fix
SELECT 'AFTER:' as status, id, user_id, email, plan, subscription_status FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- 7. Double check with a fresh query
SELECT 'FINAL CHECK:' as status, * FROM public.users WHERE email = 'meghalrp@gmail.com';