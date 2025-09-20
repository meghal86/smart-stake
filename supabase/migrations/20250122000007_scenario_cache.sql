-- Scenario caching table for performance optimization

CREATE TABLE IF NOT EXISTS scenario_cache (
  cache_key TEXT PRIMARY KEY,
  result JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenario_cache_expires ON scenario_cache(expires_at);

-- RLS for cache table
ALTER TABLE scenario_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read scenario cache" ON scenario_cache 
  FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Service role manage cache" ON scenario_cache 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION cleanup_scenario_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM scenario_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;