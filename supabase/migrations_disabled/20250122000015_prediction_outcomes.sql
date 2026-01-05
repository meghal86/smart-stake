-- Prediction outcome labeling and quality guardrails

-- Prediction outcomes table (already exists, enhance it)
ALTER TABLE scenario_outcomes 
  ADD COLUMN IF NOT EXISTS prediction_id UUID REFERENCES scenario_runs(id),
  ADD COLUMN IF NOT EXISTS expected_delta_pct NUMERIC,
  ADD COLUMN IF NOT EXISTS confidence_level NUMERIC,
  ADD COLUMN IF NOT EXISTS hit_miss BOOLEAN,
  ADD COLUMN IF NOT EXISTS error_pct NUMERIC;

-- Alert cooldowns and quality thresholds
CREATE TABLE IF NOT EXISTS alert_cooldowns (
  asset TEXT NOT NULL,
  last_alert_at TIMESTAMPTZ NOT NULL,
  alert_count_1h INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (asset)
);

-- Alert quality settings per asset
CREATE TABLE IF NOT EXISTS alert_thresholds (
  asset TEXT PRIMARY KEY,
  min_confidence NUMERIC DEFAULT 0.7,
  min_expected_impact NUMERIC DEFAULT 2.0,
  cooldown_minutes INT DEFAULT 30,
  max_alerts_per_hour INT DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default thresholds
INSERT INTO alert_thresholds (asset, min_confidence, min_expected_impact, cooldown_minutes) VALUES
  ('ETH', 0.75, 2.5, 30),
  ('BTC', 0.70, 2.0, 45),
  ('SOL', 0.65, 3.0, 30)
ON CONFLICT (asset) DO NOTHING;

-- Function to auto-label predictions after horizon
CREATE OR REPLACE FUNCTION label_prediction_outcomes()
RETURNS INTEGER AS $$
DECLARE
  labeled_count INTEGER := 0;
  prediction_record RECORD;
  current_price NUMERIC;
  realized_delta NUMERIC;
BEGIN
  -- Find unlabeled predictions past their horizon
  FOR prediction_record IN
    SELECT 
      sr.id as prediction_id,
      sr.inputs->>'asset' as asset,
      (sr.inputs->>'timeframe')::text as timeframe,
      sr.outputs->>'deltaPct' as expected_delta,
      sr.confidence,
      sr.created_at
    FROM scenario_runs sr
    LEFT JOIN scenario_outcomes so ON sr.id = so.scenario_run_id
    WHERE so.id IS NULL
      AND sr.created_at < NOW() - CASE 
        WHEN sr.inputs->>'timeframe' = '2h' THEN INTERVAL '2 hours'
        WHEN sr.inputs->>'timeframe' = '6h' THEN INTERVAL '6 hours'  
        WHEN sr.inputs->>'timeframe' = '24h' THEN INTERVAL '24 hours'
        ELSE INTERVAL '6 hours'
      END
  LOOP
    -- Get current price (simplified - would use real price API)
    current_price := 2000 + (RANDOM() - 0.5) * 200; -- Mock price
    
    -- Calculate realized delta (simplified)
    realized_delta := (RANDOM() - 0.5) * 10; -- Mock realized change
    
    -- Determine hit/miss (within 50% of expected)
    INSERT INTO scenario_outcomes (
      scenario_run_id,
      prediction_id,
      expected_delta_pct,
      realized_delta_pct,
      confidence_level,
      hit_miss,
      error_pct,
      correct,
      recorded_at
    ) VALUES (
      prediction_record.prediction_id,
      prediction_record.prediction_id,
      prediction_record.expected_delta::NUMERIC,
      realized_delta,
      prediction_record.confidence,
      ABS(realized_delta - prediction_record.expected_delta::NUMERIC) <= ABS(prediction_record.expected_delta::NUMERIC) * 0.5,
      ABS(realized_delta - prediction_record.expected_delta::NUMERIC),
      ABS(realized_delta - prediction_record.expected_delta::NUMERIC) <= ABS(prediction_record.expected_delta::NUMERIC) * 0.5,
      NOW()
    );
    
    labeled_count := labeled_count + 1;
  END LOOP;
  
  RETURN labeled_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check alert quality guardrails
CREATE OR REPLACE FUNCTION should_fire_alert(
  p_asset TEXT,
  p_confidence NUMERIC,
  p_expected_impact NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  threshold_record RECORD;
  cooldown_record RECORD;
BEGIN
  -- Get thresholds for asset
  SELECT * INTO threshold_record FROM alert_thresholds WHERE asset = p_asset;
  IF NOT FOUND THEN
    RETURN FALSE; -- No thresholds configured
  END IF;
  
  -- Check minimum confidence and impact
  IF p_confidence < threshold_record.min_confidence OR 
     ABS(p_expected_impact) < threshold_record.min_expected_impact THEN
    RETURN FALSE;
  END IF;
  
  -- Check cooldown
  SELECT * INTO cooldown_record FROM alert_cooldowns WHERE asset = p_asset;
  IF FOUND THEN
    -- Check if still in cooldown
    IF cooldown_record.last_alert_at > NOW() - (threshold_record.cooldown_minutes || ' minutes')::INTERVAL THEN
      RETURN FALSE;
    END IF;
    
    -- Check hourly limit
    IF cooldown_record.alert_count_1h >= threshold_record.max_alerts_per_hour AND
       cooldown_record.last_alert_at > NOW() - INTERVAL '1 hour' THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Update cooldown record
  INSERT INTO alert_cooldowns (asset, last_alert_at, alert_count_1h)
  VALUES (p_asset, NOW(), 1)
  ON CONFLICT (asset) DO UPDATE SET
    last_alert_at = NOW(),
    alert_count_1h = CASE 
      WHEN alert_cooldowns.last_alert_at > NOW() - INTERVAL '1 hour' 
      THEN alert_cooldowns.alert_count_1h + 1
      ELSE 1
    END;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenario_outcomes_prediction ON scenario_outcomes(prediction_id);
CREATE INDEX IF NOT EXISTS idx_alert_cooldowns_asset ON alert_cooldowns(asset, last_alert_at);

-- RLS policies
ALTER TABLE alert_cooldowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages cooldowns" ON alert_cooldowns FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Service role manages thresholds" ON alert_thresholds FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');