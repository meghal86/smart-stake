-- Create a test function to check user plan
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_user_plan(target_user_id UUID)
RETURNS TABLE(user_id UUID, email TEXT, plan TEXT, subscription_status TEXT, updated_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT u.user_id, u.email, u.plan, u.subscription_status, u.updated_at
  FROM public.users u
  WHERE u.user_id = target_user_id;
$$;