-- Phase 1.1: Time-partition scenario_runs for scale

-- Create partitioned table (if starting fresh)
-- For existing data, this would need a copy-swap approach

-- Create partitioned table with composite primary key
CREATE TABLE IF NOT EXISTS scenario_runs_partitioned (
  id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inputs JSONB NOT NULL,
  outputs JSONB NOT NULL,
  confidence NUMERIC NOT NULL,
  delta_pct NUMERIC NOT NULL,
  liquidity_impact INT NOT NULL,
  volatility_risk INT NOT NULL,
  backtest_count INT DEFAULT 0,
  backtest_median_impact NUMERIC DEFAULT 0,
  model_version TEXT DEFAULT 'v1.0',
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create current and next month partitions
CREATE TABLE IF NOT EXISTS scenario_runs_2025_01
  PARTITION OF scenario_runs_partitioned 
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS scenario_runs_2025_02
  PARTITION OF scenario_runs_partitioned 
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS ix_runs_user_2025_01 ON scenario_runs_2025_01(user_id);
CREATE INDEX IF NOT EXISTS ix_runs_created_2025_01 ON scenario_runs_2025_01(created_at);
CREATE INDEX IF NOT EXISTS ix_runs_scenario_2025_01 ON scenario_runs_2025_01(scenario_id);

CREATE INDEX IF NOT EXISTS ix_runs_user_2025_02 ON scenario_runs_2025_02(user_id);
CREATE INDEX IF NOT EXISTS ix_runs_created_2025_02 ON scenario_runs_2025_02(created_at);
CREATE INDEX IF NOT EXISTS ix_runs_scenario_2025_02 ON scenario_runs_2025_02(scenario_id);

-- Cold storage archive table
CREATE TABLE IF NOT EXISTS scenario_runs_archive (
  LIKE scenario_runs INCLUDING ALL,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_archive_user ON scenario_runs_archive(user_id);
CREATE INDEX IF NOT EXISTS ix_archive_created ON scenario_runs_archive(created_at);