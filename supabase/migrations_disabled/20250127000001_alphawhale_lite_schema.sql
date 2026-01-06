-- AlphaWhale Lite Schema
-- This migration adds the core tables for AlphaWhale Lite

-- Plan tiers (if not exists)
DO $$ BEGIN
    CREATE TYPE plan_tier AS ENUM ('LITE','PRO','ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User profile (if not exists)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  plan plan_tier not null default 'LITE',
  streak_count int not null default 0,
  last_seen_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Whale digest events (if not exists)
CREATE TABLE IF NOT EXISTS public.whale_digest (
  id bigserial primary key,
  event_time timestamptz not null,
  asset text not null,
  summary text not null,
  severity int not null check (severity between 1 and 5),
  source text not null,
  created_at timestamptz default now()
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_whale_digest_event_time ON public.whale_digest (event_time desc);

-- Whale index daily score (if not exists)
CREATE TABLE IF NOT EXISTS public.whale_index (
  id bigserial primary key,
  date date not null unique,
  score int not null check (score between 0 and 100),
  label text not null
);

-- Token unlocks (if not exists)
CREATE TABLE IF NOT EXISTS public.token_unlocks (
  id bigserial primary key,
  token text not null,
  chain text,
  unlock_time timestamptz not null,
  amount_usd numeric,
  source text,
  created_at timestamptz default now()
);

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_token_unlocks_unlock_time ON public.token_unlocks (unlock_time);

-- RLS Policies (only if not exists)
DO $$ BEGIN
    -- Enable RLS
    ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.whale_digest ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.whale_index ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.token_unlocks ENABLE ROW LEVEL SECURITY;
    
    -- User profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'own profile select') THEN
        CREATE POLICY "own profile select" ON public.user_profiles
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'own profile update') THEN
        CREATE POLICY "own profile update" ON public.user_profiles
        FOR UPDATE USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'own profile insert') THEN
        CREATE POLICY "own profile insert" ON public.user_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Whale digest policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whale_digest' AND policyname = 'read digest') THEN
        CREATE POLICY "read digest" ON public.whale_digest FOR SELECT USING (true);
    END IF;
    
    -- Whale index policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'whale_index' AND policyname = 'read index') THEN
        CREATE POLICY "read index" ON public.whale_index FOR SELECT USING (true);
    END IF;
    
    -- Token unlocks policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'token_unlocks' AND policyname = 'read unlocks') THEN
        CREATE POLICY "read unlocks" ON public.token_unlocks FOR SELECT USING (true);
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies already exist
        NULL;
END $$;

-- Function to update user profile on auth user creation (if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, handle)
  VALUES (new.id, new.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;
