-- Complete database reset and fix

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.users_metadata CASCADE;

-- Create users table with correct structure
CREATE TABLE public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  subscription_status TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_current_period_end TIMESTAMP WITH TIME ZONE,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users_metadata table
CREATE TABLE public.users_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}',
  profile JSONB DEFAULT '{}',
  subscription JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive RLS policies
CREATE POLICY "Allow all for authenticated users" ON public.users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.users_metadata
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_users_user_id ON public.users(user_id);
CREATE INDEX idx_users_metadata_user_id ON public.users_metadata(user_id);

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (user_id, email, plan)
  VALUES (new.id, new.email, 'free');
  
  -- Insert into users_metadata table
  INSERT INTO public.users_metadata (user_id, metadata, profile)
  VALUES (new.id, '{}', jsonb_build_object('email', new.email, 'name', split_part(new.email, '@', 1)));
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert record for current user if they exist
INSERT INTO public.users (user_id, email, plan)
SELECT id, email, 'free'
FROM auth.users
WHERE id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.users_metadata (user_id, metadata, profile)
SELECT id, '{}', jsonb_build_object('email', email, 'name', split_part(email, '@', 1))
FROM auth.users
WHERE id = '32bd7fd6-91e5-4504-aa30-d3fc6c76f24f'
ON CONFLICT (user_id) DO NOTHING;