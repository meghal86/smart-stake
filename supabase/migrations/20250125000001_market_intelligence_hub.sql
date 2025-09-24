-- Market Intelligence Hub Schema
-- This migration creates the necessary tables and functions for the unified Market Intelligence Hub

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Whale Clusters Table
CREATE TABLE IF NOT EXISTS whale_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_type TEXT NOT NULL CHECK (cluster_type IN ('CEX_INFLOW', 'DEFI', 'DORMANT', 'ACCUMULATION', 'DISTRIBUTION')),
  name TEXT NOT NULL,
  chain TEXT DEFAULT 'ETH',
  members_count INTEGER NOT NULL DEFAULT 0,
  sum_balance_usd DECIMAL(20,2) NOT NULL DEFAULT 0,
  risk_score DECIMAL(3,1) NOT NULL DEFAULT 0,
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Whale Addresses Table (enhanced)
CREATE TABLE IF NOT EXISTS whale_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT UNIQUE NOT NULL,
  labels TEXT[] DEFAULT '{}',
  balance_usd DECIMAL(20,2) NOT NULL DEFAULT 0,
  risk_score DECIMAL(3,1) NOT NULL DEFAULT 0,
  risk_factors TEXT[] DEFAULT '{}',
  last_activity_ts TIMESTAMPTZ DEFAULT NOW(),
  cluster_id UUID REFERENCES whale_clusters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Events Table (enhanced for Market Intelligence Hub)
CREATE TABLE IF NOT EXISTS alert_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_config_id UUID REFERENCES alert_config(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'Info' CHECK (severity IN ('High', 'Medium', 'Info')),
  score DECIMAL(3,2) DEFAULT 0,
  reasons TEXT[] DEFAULT '{}',
  cluster_id UUID REFERENCES whale_clusters(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watchlist Table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('address', 'token', 'cluster')),
  entity_id TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- Market Intelligence Cache Table
CREATE TABLE IF NOT EXISTS market_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whale_clusters_type ON whale_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_whale_clusters_risk_score ON whale_clusters(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_whale_clusters_balance ON whale_clusters(sum_balance_usd DESC);

CREATE INDEX IF NOT EXISTS idx_whale_addresses_balance ON whale_addresses(balance_usd DESC);
CREATE INDEX IF NOT EXISTS idx_whale_addresses_risk_score ON whale_addresses(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_whale_addresses_cluster ON whale_addresses(cluster_id);
CREATE INDEX IF NOT EXISTS idx_whale_addresses_activity ON whale_addresses(last_activity_ts DESC);

CREATE INDEX IF NOT EXISTS idx_alert_events_user_id ON alert_events(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_severity ON alert_events(severity);
CREATE INDEX IF NOT EXISTS idx_alert_events_created_at ON alert_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_events_cluster ON alert_events(cluster_id);
CREATE INDEX IF NOT EXISTS idx_alert_events_unread ON alert_events(user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_entity ON watchlist(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_market_cache_key ON market_intelligence_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_market_cache_expires ON market_intelligence_cache(expires_at);

-- Row Level Security (RLS) Policies
ALTER TABLE whale_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence_cache ENABLE ROW LEVEL SECURITY;

-- Whale clusters are public (read-only)
CREATE POLICY "Whale clusters are viewable by everyone" ON whale_clusters
  FOR SELECT USING (true);

-- Whale addresses are public (read-only)
CREATE POLICY "Whale addresses are viewable by everyone" ON whale_addresses
  FOR SELECT USING (true);

-- Alert events are private to users
CREATE POLICY "Users can view their own alert events" ON alert_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alert events" ON alert_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert events" ON alert_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Watchlist is private to users
CREATE POLICY "Users can manage their own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = user_id);

-- Market cache is public (read-only)
CREATE POLICY "Market cache is viewable by everyone" ON market_intelligence_cache
  FOR SELECT USING (true);

-- Functions for Market Intelligence Hub

-- Function to update whale cluster stats
CREATE OR REPLACE FUNCTION update_whale_cluster_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update cluster stats when whale addresses change
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE whale_clusters 
    SET 
      members_count = (
        SELECT COUNT(*) 
        FROM whale_addresses 
        WHERE cluster_id = NEW.cluster_id
      ),
      sum_balance_usd = (
        SELECT COALESCE(SUM(balance_usd), 0) 
        FROM whale_addresses 
        WHERE cluster_id = NEW.cluster_id
      ),
      updated_at = NOW()
    WHERE id = NEW.cluster_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE whale_clusters 
    SET 
      members_count = (
        SELECT COUNT(*) 
        FROM whale_addresses 
        WHERE cluster_id = OLD.cluster_id
      ),
      sum_balance_usd = (
        SELECT COALESCE(SUM(balance_usd), 0) 
        FROM whale_addresses 
        WHERE cluster_id = OLD.cluster_id
      ),
      updated_at = NOW()
    WHERE id = OLD.cluster_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update cluster stats
DROP TRIGGER IF EXISTS trigger_update_whale_cluster_stats ON whale_addresses;
CREATE TRIGGER trigger_update_whale_cluster_stats
  AFTER INSERT OR UPDATE OR DELETE ON whale_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_whale_cluster_stats();

-- Function to calculate alert score
CREATE OR REPLACE FUNCTION calculate_alert_score(
  usd_amount DECIMAL,
  exchange_impact DECIMAL DEFAULT 0.5,
  liquidity_impact DECIMAL DEFAULT 0.3,
  entity_reputation DECIMAL DEFAULT 0.5,
  price_correlation DECIMAL DEFAULT 0.2,
  recency_boost DECIMAL DEFAULT 0.1,
  spam_penalty DECIMAL DEFAULT 0.0
)
RETURNS DECIMAL AS $$
DECLARE
  w1 DECIMAL := 0.3; -- usd amount weight
  w2 DECIMAL := 0.2; -- exchange impact weight
  w3 DECIMAL := 0.15; -- liquidity impact weight
  w4 DECIMAL := 0.15; -- entity reputation weight
  w5 DECIMAL := 0.1; -- price correlation weight
  w6 DECIMAL := 0.05; -- recency boost weight
  w7 DECIMAL := 0.05; -- spam penalty weight
  
  usd_amount_norm DECIMAL;
  score DECIMAL;
BEGIN
  -- Normalize USD amount (log scale)
  usd_amount_norm := LEAST(1.0, LOG(GREATEST(usd_amount, 1)) / LOG(100000000)); -- Max at 100M
  
  -- Calculate weighted score
  score := w1 * usd_amount_norm + 
           w2 * exchange_impact + 
           w3 * liquidity_impact + 
           w4 * entity_reputation + 
           w5 * price_correlation + 
           w6 * recency_boost - 
           w7 * spam_penalty;
  
  RETURN GREATEST(0, LEAST(1, score));
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM market_intelligence_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create market cache
CREATE OR REPLACE FUNCTION get_or_create_cache(
  key TEXT,
  ttl_seconds INTEGER DEFAULT 300
)
RETURNS JSONB AS $$
DECLARE
  cached_data JSONB;
BEGIN
  -- Try to get cached data
  SELECT data INTO cached_data
  FROM market_intelligence_cache
  WHERE cache_key = key AND expires_at > NOW();
  
  -- Return cached data if found
  IF cached_data IS NOT NULL THEN
    RETURN cached_data;
  END IF;
  
  -- Return null if no cache found (caller should populate)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to set cache
CREATE OR REPLACE FUNCTION set_cache(
  key TEXT,
  data JSONB,
  ttl_seconds INTEGER DEFAULT 300
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO market_intelligence_cache (cache_key, data, expires_at)
  VALUES (key, data, NOW() + INTERVAL '1 second' * ttl_seconds)
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert sample whale clusters
INSERT INTO whale_clusters (cluster_type, name, chain, members_count, sum_balance_usd, risk_score, stats) VALUES
('CEX_INFLOW', 'CEX Inflow Whales', 'ETH', 23, 450000000, 75, '{"avgBalance": 19565217, "medianBalance": 15652174, "totalTransactions24h": 45, "netFlow24h": -12500000}'),
('DEFI', 'DeFi Whales', 'ETH', 156, 1200000000, 45, '{"avgBalance": 7692308, "medianBalance": 6153846, "totalTransactions24h": 234, "netFlow24h": 5600000}'),
('DORMANT', 'Dormant Whales', 'ETH', 89, 2100000000, 25, '{"avgBalance": 23595506, "medianBalance": 18876405, "totalTransactions24h": 12, "netFlow24h": 0}'),
('ACCUMULATION', 'Accumulation Whales', 'ETH', 67, 890000000, 35, '{"avgBalance": 13283582, "medianBalance": 10626866, "totalTransactions24h": 89, "netFlow24h": 8900000}'),
('DISTRIBUTION', 'Distribution Whales', 'ETH', 34, 340000000, 85, '{"avgBalance": 10000000, "medianBalance": 8000000, "totalTransactions24h": 67, "netFlow24h": -15600000}')
ON CONFLICT DO NOTHING;

-- Insert sample whale addresses
DO $$
DECLARE
  cluster_ids UUID[];
  cluster_id UUID;
  i INTEGER;
BEGIN
  -- Get cluster IDs
  SELECT ARRAY(SELECT id FROM whale_clusters ORDER BY created_at) INTO cluster_ids;
  
  -- Insert sample addresses for each cluster
  FOR i IN 1..array_length(cluster_ids, 1) LOOP
    cluster_id := cluster_ids[i];
    
    -- Insert 5 sample addresses per cluster
    FOR j IN 1..5 LOOP
      INSERT INTO whale_addresses (
        address, 
        labels, 
        balance_usd, 
        risk_score, 
        risk_factors, 
        cluster_id
      ) VALUES (
        '0x' || encode(gen_random_bytes(20), 'hex'),
        ARRAY['whale', 'tracked'],
        (random() * 50000000 + 10000000)::DECIMAL(20,2),
        (random() * 100)::DECIMAL(3,1),
        ARRAY['large_balance', 'frequent_transactions'],
        cluster_id
      );
    END LOOP;
  END LOOP;
END $$;

-- Create a view for market intelligence summary
CREATE OR REPLACE VIEW market_intelligence_summary AS
SELECT 
  COUNT(DISTINCT wa.id) as total_whales,
  COUNT(DISTINCT wa.id) FILTER (WHERE wa.last_activity_ts > NOW() - INTERVAL '24 hours') as active_whales_24h,
  COALESCE(SUM(wa.balance_usd), 0) as total_whale_balance,
  COALESCE(AVG(wa.risk_score), 0) as avg_risk_score,
  COUNT(DISTINCT wc.id) as total_clusters,
  COUNT(DISTINCT ae.id) FILTER (WHERE ae.created_at > NOW() - INTERVAL '24 hours') as alerts_24h,
  COUNT(DISTINCT ae.id) FILTER (WHERE ae.created_at > NOW() - INTERVAL '24 hours' AND ae.severity = 'High') as high_alerts_24h
FROM whale_addresses wa
LEFT JOIN whale_clusters wc ON wa.cluster_id = wc.id
LEFT JOIN alert_events ae ON ae.cluster_id = wc.id;

-- Grant necessary permissions
GRANT SELECT ON market_intelligence_summary TO authenticated;
GRANT SELECT ON whale_clusters TO authenticated;
GRANT SELECT ON whale_addresses TO authenticated;
GRANT ALL ON alert_events TO authenticated;
GRANT ALL ON watchlist TO authenticated;
GRANT SELECT ON market_intelligence_cache TO authenticated;

-- Create indexes on JSONB columns for better performance
CREATE INDEX IF NOT EXISTS idx_alert_events_trigger_data_severity ON alert_events USING GIN ((trigger_data->>'severity'));
CREATE INDEX IF NOT EXISTS idx_alert_events_trigger_data_amount ON alert_events USING GIN ((trigger_data->>'amount'));
CREATE INDEX IF NOT EXISTS idx_whale_clusters_stats ON whale_clusters USING GIN (stats);

COMMENT ON TABLE whale_clusters IS 'Whale address clusters for behavioral analysis';
COMMENT ON TABLE whale_addresses IS 'Individual whale addresses with risk scoring';
COMMENT ON TABLE alert_events IS 'Real-time alert events for market intelligence';
COMMENT ON TABLE watchlist IS 'User watchlist for tracking specific entities';
COMMENT ON TABLE market_intelligence_cache IS 'Cache for market intelligence data';