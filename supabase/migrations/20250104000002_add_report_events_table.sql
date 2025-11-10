-- Add report_events table for idempotent report submissions
-- This migration adds support for idempotency keys to prevent duplicate abuse reports

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Report categories
CREATE TYPE report_category AS ENUM (
  'phishing',
  'impersonation',
  'reward_not_paid',
  'scam',
  'other'
);

-- Report status
CREATE TYPE report_status AS ENUM (
  'pending',
  'reviewed',
  'resolved',
  'dismissed'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Report events table with idempotency support
CREATE TABLE report_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idempotency_key TEXT NOT NULL UNIQUE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_ip TEXT,
  category report_category NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for idempotency key lookups (unique constraint already creates this)
-- CREATE INDEX idx_report_events_idempotency ON report_events(idempotency_key);

-- Index for opportunity reports
CREATE INDEX idx_report_events_opportunity ON report_events(opportunity_id, created_at DESC);

-- Index for user reports
CREATE INDEX idx_report_events_user ON report_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Index for pending reports
CREATE INDEX idx_report_events_pending ON report_events(status, created_at DESC) WHERE status = 'pending';

-- Index for auto-quarantine detection (≥5 reports in 1 hour)
-- Note: Cannot use NOW() in index predicate as it's not immutable
-- Instead, we create a regular index on opportunity_id and created_at
CREATE INDEX idx_report_events_recent ON report_events(opportunity_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on report_events
ALTER TABLE report_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY p_ins_report_events ON report_events
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR auth.uid() IS NULL
  );

-- Users can view their own reports
CREATE POLICY p_sel_report_events ON report_events
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Only service role can update/delete reports
-- (No policy needed - defaults to deny for authenticated/anon)

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if opportunity should be auto-quarantined
CREATE OR REPLACE FUNCTION check_auto_quarantine(p_opportunity_id UUID)
RETURNS BOOLEAN AS $
DECLARE
  v_report_count INTEGER;
BEGIN
  -- Count unique reporters in the last hour
  SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, user_ip))
  INTO v_report_count
  FROM report_events
  WHERE opportunity_id = p_opportunity_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND status = 'pending';
  
  -- Auto-quarantine if ≥5 unique reporters
  IF v_report_count >= 5 THEN
    UPDATE opportunities
    SET status = 'quarantined',
        updated_at = NOW()
    WHERE id = p_opportunity_id
      AND status != 'quarantined';
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to check for auto-quarantine on new reports
CREATE OR REPLACE FUNCTION trg_check_auto_quarantine()
RETURNS TRIGGER AS $
BEGIN
  PERFORM check_auto_quarantine(NEW.opportunity_id);
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_report_auto_quarantine
AFTER INSERT ON report_events
FOR EACH ROW EXECUTE PROCEDURE trg_check_auto_quarantine();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE report_events IS 'Abuse reports with idempotency key support to prevent duplicates';
COMMENT ON COLUMN report_events.idempotency_key IS 'Unique idempotency key to prevent duplicate submissions';
COMMENT ON COLUMN report_events.user_ip IS 'User IP address for anonymous reports and rate limiting';
COMMENT ON COLUMN report_events.metadata IS 'Additional metadata (e.g., user agent, referrer)';

COMMENT ON FUNCTION check_auto_quarantine(UUID) IS 'Check if opportunity should be auto-quarantined (≥5 unique reporters in 1 hour)';
COMMENT ON FUNCTION trg_check_auto_quarantine() IS 'Trigger function to auto-quarantine opportunities with multiple reports';
