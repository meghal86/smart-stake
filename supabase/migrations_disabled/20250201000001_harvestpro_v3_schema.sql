-- ============================================================================
-- HarvestPro v3 Enterprise Features - Additional Schema
-- Migration: 20250201000001_harvestpro_v3_schema.sql
-- Description: Adds v3 enterprise tables and enhancements to existing tables
-- ============================================================================

-- Add v3 fields to existing harvest_sessions table
ALTER TABLE harvest_sessions 
ADD COLUMN IF NOT EXISTS custody_transaction_id TEXT;

-- Add v3 enterprise tables
CREATE TABLE IF NOT EXISTS approval_requests (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES harvest_sessions(session_id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  digital_signature TEXT,
  rejection_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS sanctions_screening_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES harvest_sessions(session_id) ON DELETE CASCADE,
  address_checked TEXT NOT NULL,
  risk_score NUMERIC CHECK (risk_score >= 0 AND risk_score <= 100),
  screening_provider TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('CLEAN', 'FLAGGED', 'BLOCKED')),
  flagged_reasons TEXT[],
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for v3 tables
-- Note: Removed WHERE clause to avoid column reference issues in same transaction
CREATE INDEX IF NOT EXISTS idx_harvest_sessions_custody 
  ON harvest_sessions(custody_transaction_id);

CREATE INDEX IF NOT EXISTS idx_approval_requests_session 
  ON approval_requests(session_id);

CREATE INDEX IF NOT EXISTS idx_approval_requests_approver 
  ON approval_requests(approver_id, status);

CREATE INDEX IF NOT EXISTS idx_approval_requests_requester 
  ON approval_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_sanctions_logs_session 
  ON sanctions_screening_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_sanctions_logs_address 
  ON sanctions_screening_logs(address_checked);

CREATE INDEX IF NOT EXISTS idx_sanctions_logs_result 
  ON sanctions_screening_logs(result, checked_at);

-- Enable RLS on new tables
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_screening_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for approval_requests (requester or approver can view)
CREATE POLICY p_approval_requests_user ON approval_requests
  FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = approver_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = approver_id);

-- RLS policies for sanctions_screening_logs (access through session)
CREATE POLICY p_sanctions_logs_user ON sanctions_screening_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM harvest_sessions 
      WHERE harvest_sessions.session_id = sanctions_screening_logs.session_id 
      AND harvest_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (TRUE);

-- Comments for documentation
COMMENT ON TABLE approval_requests IS 'v3: Maker/checker governance workflow for large transactions';
COMMENT ON TABLE sanctions_screening_logs IS 'v3: KYT/AML compliance audit trail';
