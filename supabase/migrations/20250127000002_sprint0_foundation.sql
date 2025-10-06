-- Sprint 0: Complete foundation schema

-- Extend users table with missing Sprint 0 fields
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'lite'
    CHECK (plan_tier IN ('lite','pro','premium','institutional')),
  ADD COLUMN IF NOT EXISTS ui_mode text NOT NULL DEFAULT 'auto'
    CHECK (ui_mode IN ('novice','pro','auto')),
  ADD COLUMN IF NOT EXISTS experience_score int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS referral_unlock_ends_at timestamptz;

-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly_cents int,
  price_yearly_cents int,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Seed plans
INSERT INTO public.plans (id,name,price_monthly_cents,features,limits) VALUES
('lite','Free',0,'{"whale_alerts":true,"basic_digest":true}', '{"alerts_per_day":50}'),
('pro','Pro',999,'{"watchlist":true,"alerts_advanced":true,"copilot_advanced":true,"reports_export":true}', '{"alerts_per_day":10000}')
ON CONFLICT (id) DO NOTHING;

-- Entitlement/telemetry events
CREATE TABLE IF NOT EXISTS public.entitlement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  plan_tier text,
  feature text,
  event text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Feature flags (if not exists from previous migration)
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  rollout_percentage int NOT NULL DEFAULT 0,
  conditions jsonb DEFAULT '{}'::jsonb
);

-- Seed feature flags
INSERT INTO public.feature_flags (key,enabled,rollout_percentage) VALUES
('lite_home_default', false, 0),
('signals_on_home', true, 100),
('ai_copilot_card', true, 100),
('watchlist_v2', false, 0)
ON CONFLICT (key) DO NOTHING;

-- RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlement_events ENABLE ROW LEVEL SECURITY;

-- Users can only see/update their own data
DROP POLICY IF EXISTS "users_self" ON public.users;
CREATE POLICY "users_self" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Users can only insert/select their own events
DROP POLICY IF EXISTS "events_self" ON public.entitlement_events;
CREATE POLICY "events_self" ON public.entitlement_events
  FOR ALL USING (auth.uid() = user_id);