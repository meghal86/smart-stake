-- V2 Deeper Telemetry Tables
-- Requirements: 16.3, 16.4, 16.5
-- 
-- This migration creates tables for advanced telemetry metrics:
-- - MTTS (Mean Time To Safety) tracking
-- - Prevented loss modeling
-- - Fix rate and false positive rate tracking
-- - Action funnel analytics

-- MTTS (Mean Time To Safety) Metrics Table
CREATE TABLE IF NOT EXISTS portfolio_mtts_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  issue_type TEXT NOT NULL CHECK (issue_type IN ('approval_risk', 'policy_violation', 'simulation_failure', 'security_warning')),
  detected_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  time_to_safety_ms BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mtts_user_severity ON portfolio_mtts_metrics (user_id, severity);
CREATE INDEX idx_mtts_issue_type ON portfolio_mtts_metrics (issue_type);
CREATE INDEX idx_mtts_detected_at ON portfolio_mtts_metrics (detected_at DESC);
CREATE INDEX idx_mtts_resolved ON portfolio_mtts_metrics (resolved_at) WHERE resolved_at IS NOT NULL;
CREATE UNIQUE INDEX uniq_mtts_issue ON portfolio_mtts_metrics (user_id, issue_id);

-- Enable RLS
ALTER TABLE portfolio_mtts_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mtts_metrics_rw_own" ON portfolio_mtts_metrics
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Prevented Loss Metrics Table
CREATE TABLE IF NOT EXISTS portfolio_prevented_loss_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('revoke_approval', 'reject_transaction', 'policy_block', 'simulation_block')),
  prevented_loss_usd DECIMAL(20, 8) NOT NULL CHECK (prevented_loss_usd >= 0),
  confidence NUMERIC(5, 4) NOT NULL CHECK (confidence >= 0.0000 AND confidence <= 1.0000),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prevented_loss_user ON portfolio_prevented_loss_metrics (user_id);
CREATE INDEX idx_prevented_loss_action_type ON portfolio_prevented_loss_metrics (action_type);
CREATE INDEX idx_prevented_loss_severity ON portfolio_prevented_loss_metrics (severity);
CREATE INDEX idx_prevented_loss_timestamp ON portfolio_prevented_loss_metrics (timestamp DESC);
CREATE INDEX idx_prevented_loss_amount ON portfolio_prevented_loss_metrics (prevented_loss_usd DESC);

-- Enable RLS
ALTER TABLE portfolio_prevented_loss_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prevented_loss_metrics_rw_own" ON portfolio_prevented_loss_metrics
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix Rate Metrics Table
CREATE TABLE IF NOT EXISTS portfolio_fix_rate_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  presented BOOLEAN NOT NULL DEFAULT TRUE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fix_rate_user ON portfolio_fix_rate_metrics (user_id);
CREATE INDEX idx_fix_rate_action_type ON portfolio_fix_rate_metrics (action_type);
CREATE INDEX idx_fix_rate_severity ON portfolio_fix_rate_metrics (severity);
CREATE INDEX idx_fix_rate_completed ON portfolio_fix_rate_metrics (completed);
CREATE INDEX idx_fix_rate_timestamp ON portfolio_fix_rate_metrics (timestamp DESC);
CREATE UNIQUE INDEX uniq_fix_rate_action ON portfolio_fix_rate_metrics (user_id, action_id);

-- Enable RLS
ALTER TABLE portfolio_fix_rate_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fix_rate_metrics_rw_own" ON portfolio_fix_rate_metrics
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- False Positive Metrics Table
CREATE TABLE IF NOT EXISTS portfolio_false_positive_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue_id TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  overridden BOOLEAN NOT NULL DEFAULT FALSE,
  feedback TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fp_user ON portfolio_false_positive_metrics (user_id);
CREATE INDEX idx_fp_issue_type ON portfolio_false_positive_metrics (issue_type);
CREATE INDEX idx_fp_severity ON portfolio_false_positive_metrics (severity);
CREATE INDEX idx_fp_dismissed ON portfolio_false_positive_metrics (dismissed);
CREATE INDEX idx_fp_overridden ON portfolio_false_positive_metrics (overridden);
CREATE INDEX idx_fp_timestamp ON portfolio_false_positive_metrics (timestamp DESC);
CREATE UNIQUE INDEX uniq_fp_issue ON portfolio_false_positive_metrics (user_id, issue_id);

-- Enable RLS
ALTER TABLE portfolio_false_positive_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_metrics_rw_own" ON portfolio_false_positive_metrics
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Action Funnel Metrics Table
CREATE TABLE IF NOT EXISTS portfolio_action_funnel_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('card_viewed', 'plan_created', 'simulated', 'signing', 'submitted', 'confirmed', 'failed')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_funnel_user ON portfolio_action_funnel_metrics (user_id);
CREATE INDEX idx_funnel_action ON portfolio_action_funnel_metrics (action_id);
CREATE INDEX idx_funnel_correlation ON portfolio_action_funnel_metrics (correlation_id);
CREATE INDEX idx_funnel_stage ON portfolio_action_funnel_metrics (stage);
CREATE INDEX idx_funnel_timestamp ON portfolio_action_funnel_metrics (timestamp DESC);
CREATE INDEX idx_funnel_user_stage ON portfolio_action_funnel_metrics (user_id, stage, timestamp DESC);

-- Enable RLS
ALTER TABLE portfolio_action_funnel_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funnel_metrics_rw_own" ON portfolio_action_funnel_metrics
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER trg_mtts_updated_at
  BEFORE UPDATE ON portfolio_mtts_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE portfolio_mtts_metrics IS 'Tracks Mean Time To Safety for security issues';
COMMENT ON TABLE portfolio_prevented_loss_metrics IS 'Tracks dollar value of losses prevented by security features';
COMMENT ON TABLE portfolio_fix_rate_metrics IS 'Tracks completion rate of recommended actions';
COMMENT ON TABLE portfolio_false_positive_metrics IS 'Tracks false positive rate for critical alerts';
COMMENT ON TABLE portfolio_action_funnel_metrics IS 'Tracks user progression through action execution flow';

COMMENT ON COLUMN portfolio_mtts_metrics.time_to_safety_ms IS 'Time in milliseconds from detection to resolution';
COMMENT ON COLUMN portfolio_prevented_loss_metrics.prevented_loss_usd IS 'Estimated dollar value of prevented loss';
COMMENT ON COLUMN portfolio_prevented_loss_metrics.confidence IS 'Confidence score (0.0000-1.0000) for loss estimate';
COMMENT ON COLUMN portfolio_fix_rate_metrics.presented IS 'Whether action was presented to user';
COMMENT ON COLUMN portfolio_fix_rate_metrics.completed IS 'Whether user completed the action';
COMMENT ON COLUMN portfolio_fix_rate_metrics.dismissed IS 'Whether user dismissed the action';
COMMENT ON COLUMN portfolio_false_positive_metrics.dismissed IS 'Whether user dismissed the alert';
COMMENT ON COLUMN portfolio_false_positive_metrics.overridden IS 'Whether user overrode the safety warning';
COMMENT ON COLUMN portfolio_action_funnel_metrics.correlation_id IS 'Session or request correlation ID for tracking user journey';
