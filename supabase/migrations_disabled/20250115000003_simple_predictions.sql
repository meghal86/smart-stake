-- Simple whale predictions table
CREATE TABLE IF NOT EXISTS whale_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type TEXT NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE whale_predictions ENABLE ROW LEVEL SECURITY;

-- Allow read access
CREATE POLICY "whale_predictions_read" ON whale_predictions FOR SELECT USING (true);

-- Grant permissions
GRANT SELECT ON whale_predictions TO authenticated;