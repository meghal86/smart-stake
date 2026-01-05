-- Guardian Confidence Scores and Evidence Metadata
-- Adds confidence tracking and evidence provenance to scan results

-- First, ensure users table has wallet_address column (add if missing)
ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS wallet_address text;

-- Add unique constraint if wallet_address exists and doesn't have one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_wallet_address_key' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_wallet_address_key UNIQUE (wallet_address);
  END IF;
END $$;

-- Add confidence column to scans table
ALTER TABLE IF EXISTS scans
ADD COLUMN IF NOT EXISTS confidence numeric DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1);

-- Add evidence metadata column (JSONB for flexibility)
ALTER TABLE IF EXISTS scans
ADD COLUMN IF NOT EXISTS evidence_metadata jsonb DEFAULT '{}';

-- Add request_id for observability
ALTER TABLE IF EXISTS scans
ADD COLUMN IF NOT EXISTS request_id text;

-- Create index on confidence for filtering low-confidence scans
CREATE INDEX IF NOT EXISTS idx_scans_confidence ON scans(confidence DESC);

-- Create index on request_id for debugging
CREATE INDEX IF NOT EXISTS idx_scans_request_id ON scans(request_id);

-- Create partial index for high-confidence scans
-- Note: Removed time-based filter as now() is not IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_scans_high_confidence 
ON scans(target_address, created_at DESC) 
WHERE confidence > 0.7;

-- Add cache metrics table for observability
CREATE TABLE IF NOT EXISTS cache_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  metric_name text NOT NULL,
  hits integer DEFAULT 0,
  misses integer DEFAULT 0,
  hit_ratio numeric GENERATED ALWAYS AS (
    CASE 
      WHEN (hits + misses) > 0 THEN hits::numeric / (hits + misses)
      ELSE 0 
    END
  ) STORED,
  avg_age_ms numeric,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_cache_metrics_name ON cache_metrics(metric_name, created_at DESC);

-- Add idempotency keys table for revoke operations
CREATE TABLE IF NOT EXISTS revoke_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text UNIQUE NOT NULL,
  user_address text NOT NULL,
  token_address text NOT NULL,
  spender_address text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  tx_hash text,
  error_message text,
  gas_used bigint,
  score_delta integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '5 minutes'
);

CREATE INDEX IF NOT EXISTS idx_revoke_ops_idempotency_key ON revoke_operations(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_revoke_ops_user ON revoke_operations(user_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revoke_ops_expires ON revoke_operations(expires_at) WHERE status = 'pending';

-- Auto-delete expired pending operations
CREATE OR REPLACE FUNCTION cleanup_expired_revoke_operations()
RETURNS void AS $$
BEGIN
  DELETE FROM revoke_operations 
  WHERE status = 'pending' AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  operation text NOT NULL,
  duration_ms integer NOT NULL,
  success boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_operation ON performance_metrics(operation, created_at DESC);

-- Add RLS policies for new tables
ALTER TABLE cache_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE revoke_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to cache_metrics" ON cache_metrics
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to revoke_operations" ON revoke_operations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to performance_metrics" ON performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own revoke operations
-- Works with both user_id and wallet_address
CREATE POLICY "Users can read their revoke operations" ON revoke_operations
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT id::text FROM users 
      WHERE wallet_address = revoke_operations.user_address
         OR user_id = auth.uid()
    )
  );

-- Create view for scan results with confidence
-- Note: s.* already includes confidence, evidence_metadata, and request_id
CREATE OR REPLACE VIEW guardian_scans_with_confidence AS
SELECT 
  s.*,
  CASE 
    WHEN s.confidence >= 0.9 THEN 'high'
    WHEN s.confidence >= 0.7 THEN 'medium'
    ELSE 'low'
  END as confidence_level,
  COALESCE(u.wallet_address, u.email, u.user_id::text) as user_identifier
FROM scans s
LEFT JOIN users u ON s.user_id = u.id;

-- Grant access to view
GRANT SELECT ON guardian_scans_with_confidence TO authenticated;
GRANT SELECT ON guardian_scans_with_confidence TO anon;

COMMENT ON COLUMN scans.confidence IS 'Confidence score (0-1) based on evidence quality and freshness';
COMMENT ON COLUMN scans.evidence_metadata IS 'Structured evidence provenance (sources, timestamps, TTLs)';
COMMENT ON COLUMN scans.request_id IS 'Unique request ID for tracing and debugging';
COMMENT ON TABLE revoke_operations IS 'Tracks revoke operations with idempotency keys to prevent duplicates';
COMMENT ON TABLE cache_metrics IS 'Cache performance metrics for monitoring';
COMMENT ON TABLE performance_metrics IS 'Operation performance tracking for observability';

