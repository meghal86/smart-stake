-- Scenarios system tables
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  asset TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  whale_count INT NOT NULL,
  txn_size NUMERIC NOT NULL,
  direction TEXT NOT NULL,
  market_condition TEXT NOT NULL,
  cex_flow_bias INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scenario_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inputs JSONB NOT NULL,
  outputs JSONB NOT NULL,
  confidence NUMERIC NOT NULL,
  delta_pct NUMERIC NOT NULL,
  liquidity_impact INT NOT NULL,
  volatility_risk INT NOT NULL,
  backtest_count INT DEFAULT 0,
  backtest_median_impact NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_params (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  param_name TEXT NOT NULL UNIQUE,
  param_value NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_runs_user_id ON scenario_runs(user_id);

-- RLS policies
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_params ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scenarios" ON scenarios FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own scenario runs" ON scenario_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read model params" ON model_params FOR SELECT USING (true);

-- Seed model parameters
INSERT INTO model_params (param_name, param_value, description) VALUES
  ('k1_whale_impact', 0.15, 'Base whale transaction impact coefficient'),
  ('k2_market_multiplier', 1.2, 'Market condition impact multiplier'),
  ('k3_cex_flow_weight', 0.8, 'CEX flow bias weight factor'),
  ('k4_volatility_base', 25.0, 'Base volatility risk score')
ON CONFLICT (param_name) DO NOTHING;