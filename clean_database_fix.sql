-- Clean database fix script

-- First, check what users exist in auth
SELECT 'Auth users:' as info, id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Check what users exist in public.users
SELECT 'Public users:' as info, user_id, email, plan FROM public.users;

-- Drop the foreign key constraint if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_user_id_fkey;

-- Create the users table with correct structure (without foreign key constraint for now)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,
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

-- Update the constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_plan_check;
ALTER TABLE public.users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'pro', 'premium'));

-- Set up RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);

-- Clean up any orphaned records (users in public.users but not in auth.users)
DELETE FROM public.users 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Insert records for all auth users
INSERT INTO public.users (user_id, email, plan)
SELECT au.id, au.email, 'free'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.user_id
WHERE pu.user_id IS NULL;

-- Fix users_metadata table constraints
ALTER TABLE public.users_metadata DROP CONSTRAINT IF EXISTS users_metadata_user_id_fkey;

-- Create users_metadata table if it doesn't exist (without foreign key constraint)
CREATE TABLE IF NOT EXISTS public.users_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  preferences JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clean up orphaned metadata records
DELETE FROM public.users_metadata 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Set up RLS for users_metadata
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for users_metadata
DROP POLICY IF EXISTS "Users can view own metadata" ON public.users_metadata;
DROP POLICY IF EXISTS "Users can update own metadata" ON public.users_metadata;
DROP POLICY IF EXISTS "Users can insert own metadata" ON public.users_metadata;

CREATE POLICY "Users can view own metadata" ON public.users_metadata FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own metadata" ON public.users_metadata FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metadata" ON public.users_metadata FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for users_metadata
CREATE INDEX IF NOT EXISTS idx_users_metadata_user_id ON public.users_metadata(user_id);

-- Optionally re-add the foreign key constraints (commented out for safety)
-- ALTER TABLE public.users ADD CONSTRAINT users_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ALTER TABLE public.users_metadata ADD CONSTRAINT users_metadata_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;