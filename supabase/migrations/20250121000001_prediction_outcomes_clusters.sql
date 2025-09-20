-- Prediction outcomes tracking
CREATE TABLE IF NOT EXISTS prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id TEXT NOT NULL,
  asset TEXT NOT NULL,
  horizon_min INT NOT NULL,
  predicted_direction TEXT CHECK (predicted_direction IN ('long','short')),
  predicted_ts TIMESTAMPTZ NOT NULL,
  realized_return NUMERIC,
  was_correct BOOLEAN,
  realized_ts TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_pid ON prediction_outcomes(prediction_id);

-- Prediction clusters for signal grouping
CREATE TABLE IF NOT EXISTS prediction_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  assets TEXT[] NOT NULL,
  signal_count INT NOT NULL,
  direction TEXT CHECK (direction IN ('long','short')),
  confidence NUMERIC NOT NULL,
  rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE prediction_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read prediction outcomes" ON prediction_outcomes FOR SELECT USING (true);
CREATE POLICY "Users can read prediction clusters" ON prediction_clusters FOR SELECT USING (true);