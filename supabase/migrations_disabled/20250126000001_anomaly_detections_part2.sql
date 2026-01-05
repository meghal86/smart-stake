-- Anomaly Detection System - Part 2
-- Add foreign keys and RLS policies

-- Add foreign key constraints (after tables exist)
ALTER TABLE anomaly_alerts
  DROP CONSTRAINT IF EXISTS anomaly_alerts_user_id_fkey,
  ADD CONSTRAINT anomaly_alerts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE anomaly_alerts
  DROP CONSTRAINT IF EXISTS anomaly_alerts_anomaly_id_fkey,
  ADD CONSTRAINT anomaly_alerts_anomaly_id_fkey 
    FOREIGN KEY (anomaly_id) REFERENCES anomaly_detections(anomaly_id);

ALTER TABLE anomaly_detections
  DROP CONSTRAINT IF EXISTS anomaly_detections_resolved_by_fkey,
  ADD CONSTRAINT anomaly_detections_resolved_by_fkey 
    FOREIGN KEY (resolved_by) REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_alerts ENABLE ROW LEVEL SECURITY;

-- Public read access to anomalies
CREATE POLICY "Anyone can view anomaly detections"
  ON anomaly_detections FOR SELECT
  USING (true);

-- Service role can manage anomalies
CREATE POLICY "Service role can manage anomalies"
  ON anomaly_detections FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own alerts
CREATE POLICY "Users can view their own anomaly alerts"
  ON anomaly_alerts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update their own anomaly alerts"
  ON anomaly_alerts FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert alerts
CREATE POLICY "Service role can create anomaly alerts"
  ON anomaly_alerts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

