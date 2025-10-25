-- Anomaly Detection System Tables - Part 1
-- Create tables only (no triggers or policies)

-- Main anomaly detections table
CREATE TABLE IF NOT EXISTS anomaly_detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anomaly_id TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence DECIMAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  type TEXT NOT NULL CHECK (type IN (
    'volume_spike',
    'velocity_anomaly',
    'cluster_behavior',
    'dormant_activation',
    'mass_transfer',
    'coordinated_movement',
    'balance_deviation',
    'unusual_pattern'
  )),
  description TEXT NOT NULL,
  affected_whales TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  suggested_actions TEXT[] DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anomaly alerts for users
CREATE TABLE IF NOT EXISTS anomaly_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  anomaly_id TEXT NOT NULL,
  viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_timestamp ON anomaly_detections(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_severity ON anomaly_detections(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_type ON anomaly_detections(type);
CREATE INDEX IF NOT EXISTS idx_anomaly_detections_resolved ON anomaly_detections(resolved);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_user_id ON anomaly_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_viewed ON anomaly_alerts(user_id, viewed);

COMMENT ON TABLE anomaly_detections IS 'Stores detected whale behavior anomalies from the ML pattern recognition system';
COMMENT ON TABLE anomaly_alerts IS 'User-specific alerts for anomaly detections (Pro+ feature)';

