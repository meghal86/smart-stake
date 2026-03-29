-- Force update with maximum privileges
-- Run this as the postgres user in Supabase SQL Editor

-- Check current state
SELECT 'BEFORE UPDATE:' as status, * FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- Disable all constraints temporarily
SET session_replication_role = replica;

-- Disable RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Force update
UPDATE public.users 
SET 
  plan = 'pro',
  subscription_status = 'active',
  updated_at = NOW()
WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- Check if update worked
SELECT 'AFTER UPDATE:' as status, * FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';

-- Re-enable everything
SET session_replication_role = DEFAULT;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Final check
SELECT 'FINAL CHECK:' as status, user_id, email, plan, subscription_status FROM public.users WHERE user_id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f';