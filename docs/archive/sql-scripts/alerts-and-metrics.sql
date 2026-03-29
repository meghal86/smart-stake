-- Alert configuration table
CREATE TABLE IF NOT EXISTS alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('price_drop', 'whale_move', 'stress_impact', 'whale_proximity')),
  threshold JSONB NOT NULL, -- {token: 'BTC', amount: 1000000, direction: 'inflow'}
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
  quota_daily INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert triggers/events table
CREATE TABLE IF NOT EXISTS alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_config_id UUID REFERENCES alert_config(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business metrics table
CREATE TABLE IF NOT EXISTS product_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Whale proximity graph (deterministic)
CREATE TABLE IF NOT EXISTS whale_proximity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  neighbor_address TEXT NOT NULL,
  hops INTEGER NOT NULL CHECK (hops BETWEEN 1 AND 3),
  wallet_size_tier TEXT NOT NULL CHECK (wallet_size_tier IN ('small', 'medium', 'large', 'whale')),
  block_seed BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, neighbor_address, block_seed)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_config_user_active ON alert_config(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_alert_events_user_unread ON alert_events(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_metrics_type_time ON product_metrics(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whale_proximity_wallet ON whale_proximity(wallet_address, hops);

-- RLS policies
ALTER TABLE alert_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_proximity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own alerts" ON alert_config FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see their own alert events" ON alert_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can insert metrics" ON product_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Whale proximity is public read" ON whale_proximity FOR SELECT USING (true);