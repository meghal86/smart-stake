-- Sprint 0: Minimal additions only

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

-- Add Sprint 0 feature flags
INSERT INTO public.feature_flags (key,enabled,config) VALUES
('lite_home_default', false, '{}'),
('signals_on_home', true, '{}'),
('ai_copilot_card', true, '{}'),
('watchlist_v2', false, '{}')
ON CONFLICT (key) DO NOTHING;