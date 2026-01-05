-- Priority-1 Production Fixes for Scenarios

-- 1.1 Restore scenario_id FK (orphan protection)
ALTER TABLE scenario_runs
  ADD COLUMN IF NOT EXISTS scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL;

-- 1.2 Input schema validation
ALTER TABLE scenarios
  ADD CONSTRAINT scenarios_inputs_min_schema
  CHECK (
    inputs ? 'asset'
    AND inputs ? 'timeframe'
    AND inputs ? 'direction'
    AND (inputs->>'asset') IN ('ETH','BTC','SOL')
  );

-- 1.3 Share access logging for rate limiting
CREATE TABLE IF NOT EXISTS share_access_log (
  token TEXT NOT NULL,
  ip_address INET NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_access_log_token_ip ON share_access_log(token, ip_address, accessed_at);

-- 1.4 Enhanced indexes for cleanup and performance
CREATE INDEX IF NOT EXISTS idx_scenario_shares_expires ON scenario_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_scenario_runs_created_at ON scenario_runs(created_at);

-- 1.5 User scenario quotas (prevent abuse)
CREATE OR REPLACE FUNCTION check_scenario_quota()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM scenarios WHERE user_id = NEW.user_id) >= 100 THEN
    RAISE EXCEPTION 'Maximum scenarios per user exceeded (100)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scenario_quota_check
  BEFORE INSERT ON scenarios
  FOR EACH ROW EXECUTE FUNCTION check_scenario_quota();

-- 1.6 Cleanup function for expired shares
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