-- Market Intelligence Hub - Simple Migration
-- Works with existing schema

-- Create watchlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('address', 'token', 'cluster')),
  entity_id TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- Create market intelligence cache table
CREATE TABLE IF NOT EXISTS market_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_entity ON watchlist(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_market_cache_key ON market_intelligence_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_market_cache_expires ON market_intelligence_cache(expires_at);

-- Enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_intelligence_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Market cache is viewable by everyone" ON market_intelligence_cache
  FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON watchlist TO authenticated;
GRANT SELECT ON market_intelligence_cache TO authenticated;

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