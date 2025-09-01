-- Complete database fix for users table and constraints

-- First, let's make sure the users table exists with correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  plan TEXT DEFAULT 'free',
  subscription_status TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_current_period_end TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop the old constraint if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_plan_check;

-- Add the new constraint that allows 'free', 'pro', and 'premium'
ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('free', 'pro', 'premium'));

-- Make sure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Create fresh RLS policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);

-- Insert your user record if it doesn't exist (replace with your actual user ID)
INSERT INTO public.users (user_id, email, plan) 
VALUES ('259c3764-dfc1-4ba3-abdc-b6ebd7f0ea1c', 'your-email@example.com', 'free')
ON CONFLICT (user_id) DO NOTHING;