-- Clean Priority-1 Production Fixes for Scenarios

-- 1.1 Restore scenario_id FK (orphan protection)
ALTER TABLE scenario_runs
  ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL;

-- 1.2 Input schema validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'scenarios_inputs_min_schema'
  ) THEN
    ALTER TABLE scenarios
      ADD CONSTRAINT scenarios_inputs_min_schema
      CHECK (
        inputs ? 'asset'
        AND inputs ? 'timeframe'
        AND inputs ? 'direction'
        AND (inputs->>'asset') IN ('ETH','BTC','SOL')
      );
  END IF;
END $$;

-- 1.3 Share access logging for rate limiting
CREATE TABLE IF NOT EXISTS share_access_log (
  token TEXT NOT NULL,
  ip_address INET NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_access_log_token_ip ON share_access_log(token, ip_address, accessed_at);

-- 1.4 Simple indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenario_shares_expires ON scenario_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_scenario_runs_created_at ON scenario_runs(created_at);

-- 1.5 Cleanup function for expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM scenario_shares 
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;