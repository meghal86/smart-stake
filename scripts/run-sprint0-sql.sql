-- Sprint 0: Add missing tables only (safe to run multiple times)

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

-- Add Sprint 0 feature flags (matching your existing schema)
INSERT INTO public.feature_flags (key,enabled,config) VALUES
('lite_home_default', false, '{}'),
('signals_on_home', true, '{}'),
('ai_copilot_card', true, '{}'),
('watchlist_v2', false, '{}')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.entitlement_events ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'entitlement_events' AND policyname = 'events_self') THEN
        CREATE POLICY "events_self" ON public.entitlement_events
        FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;