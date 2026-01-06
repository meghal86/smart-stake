-- Scenarios v2: History, Sharing, Visualization, Enterprise
-- Update existing scenarios table
ALTER TABLE scenarios 
  DROP COLUMN IF EXISTS asset,
  DROP COLUMN IF EXISTS timeframe,
  DROP COLUMN IF EXISTS whale_count,
  DROP COLUMN IF EXISTS txn_size,
  DROP COLUMN IF EXISTS direction,
  DROP COLUMN IF EXISTS market_condition,
  DROP COLUMN IF EXISTS cex_flow_bias,
  ADD COLUMN IF NOT EXISTS inputs JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_result JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update scenario_runs table
ALTER TABLE scenario_runs 
  ADD COLUMN IF NOT EXISTS model_version TEXT DEFAULT 'v1.0',
  DROP COLUMN IF EXISTS scenario_id;

-- Public share tokens
CREATE TABLE IF NOT EXISTS scenario_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  redaction_tier TEXT NOT NULL CHECK (redaction_tier IN ('free','pro','premium','enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accuracy telemetry
CREATE TABLE IF NOT EXISTS scenario_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_run_id UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE,
  realized_delta_pct NUMERIC,
  horizon_hours INT,
  correct BOOLEAN,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenario_shares_token ON scenario_shares(token);
CREATE INDEX IF NOT EXISTS idx_scenario_shares_expires ON scenario_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_scenario_outcomes_run_id ON scenario_outcomes(scenario_run_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_inputs ON scenarios USING GIN(inputs);
CREATE INDEX IF NOT EXISTS idx_scenario_runs_inputs ON scenario_runs USING GIN(inputs);

-- RLS policies for new tables
ALTER TABLE scenario_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read scenario shares" ON scenario_shares FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users can create scenario shares" ON scenario_shares FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM scenarios WHERE id = scenario_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view scenario outcomes" ON scenario_outcomes FOR SELECT USING (
  EXISTS (SELECT 1 FROM scenario_runs WHERE id = scenario_run_id AND user_id = auth.uid())
);

-- Update trigger for scenarios
CREATE OR REPLACE FUNCTION update_scenarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scenarios_updated_at 
  BEFORE UPDATE ON scenarios 
  FOR EACH ROW EXECUTE FUNCTION update_scenarios_updated_at();