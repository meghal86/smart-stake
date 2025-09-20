-- Post-deployment validation and monitoring infrastructure

-- SLO monitoring views
CREATE OR REPLACE VIEW v_prediction_slo_daily AS
SELECT
  DATE(so.recorded_at) as day,
  COUNT(*) as labeled,
  ROUND(AVG(CASE WHEN so.correct THEN 1 ELSE 0 END) * 100, 2) as hit_rate,
  ROUND(AVG(so.confidence_level) * 100, 2) as avg_confidence,
  COUNT(*) FILTER (WHERE so.recorded_at >= NOW() - INTERVAL '7 days') as labeled_7d,
  COUNT(*) FILTER (WHERE so.recorded_at >= NOW() - INTERVAL '30 days') as labeled_30d
FROM scenario_outcomes so
WHERE so.recorded_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(so.recorded_at)
ORDER BY day DESC;

-- Alert storm detection
CREATE OR REPLACE VIEW v_alert_storm_hourly AS
WITH hourly_alerts AS (
  SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    asset,
    COUNT(*) as alert_count
  FROM alert_cooldowns
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY DATE_TRUNC('hour', created_at), asset
)
SELECT 
  hour,
  asset,
  alert_count,
  CASE 
    WHEN alert_count > 2 THEN 'STORM'
    WHEN alert_count = 2 THEN 'WARNING'
    ELSE 'OK'
  END as status
FROM hourly_alerts
WHERE alert_count > 0
ORDER BY hour DESC, alert_count DESC;

-- Guardrail acceptance rate monitoring
CREATE OR REPLACE VIEW v_guardrail_acceptance AS
WITH eligible_signals AS (
  SELECT 
    sr.id,
    sr.inputs->>'asset' as asset,
    sr.confidence,
    ABS((sr.outputs->>'deltaPct')::NUMERIC) as impact,
    sr.created_at
  FROM scenario_runs sr
  WHERE sr.created_at >= NOW() - INTERVAL '24 hours'
    AND sr.confidence >= 0.70
    AND ABS((sr.outputs->>'deltaPct')::NUMERIC) >= 2.0
),
fired_alerts AS (
  SELECT DISTINCT ac.asset, ac.created_at
  FROM alert_cooldowns ac
  WHERE ac.created_at >= NOW() - INTERVAL '24 hours'
)
SELECT 
  es.asset,
  COUNT(es.id) as eligible_signals,
  COUNT(fa.asset) as fired_alerts,
  ROUND(COUNT(fa.asset)::NUMERIC / NULLIF(COUNT(es.id), 0) * 100, 2) as acceptance_rate
FROM eligible_signals es
LEFT JOIN fired_alerts fa ON es.asset = fa.asset 
  AND fa.created_at BETWEEN es.created_at AND es.created_at + INTERVAL '1 hour'
GROUP BY es.asset
ORDER BY acceptance_rate DESC;

-- Orphaned predictions check
CREATE OR REPLACE VIEW v_orphaned_predictions AS
SELECT 
  sr.id,
  sr.inputs->>'asset' as asset,
  sr.inputs->>'timeframe' as timeframe,
  sr.created_at,
  sr.created_at + CASE 
    WHEN sr.inputs->>'timeframe' = '2h' THEN INTERVAL '2 hours'
    WHEN sr.inputs->>'timeframe' = '6h' THEN INTERVAL '6 hours'  
    WHEN sr.inputs->>'timeframe' = '24h' THEN INTERVAL '24 hours'
    ELSE INTERVAL '6 hours'
  END as horizon_end,
  NOW() - (sr.created_at + CASE 
    WHEN sr.inputs->>'timeframe' = '2h' THEN INTERVAL '2 hours'
    WHEN sr.inputs->>'timeframe' = '6h' THEN INTERVAL '6 hours'  
    WHEN sr.inputs->>'timeframe' = '24h' THEN INTERVAL '24 hours'
    ELSE INTERVAL '6 hours'
  END) as overdue_by
FROM scenario_runs sr
LEFT JOIN scenario_outcomes so ON sr.id = so.scenario_run_id
WHERE so.id IS NULL
  AND sr.created_at + CASE 
    WHEN sr.inputs->>'timeframe' = '2h' THEN INTERVAL '2 hours'
    WHEN sr.inputs->>'timeframe' = '6h' THEN INTERVAL '6 hours'  
    WHEN sr.inputs->>'timeframe' = '24h' THEN INTERVAL '24 hours'
    ELSE INTERVAL '6 hours'
  END < NOW()
ORDER BY overdue_by DESC;

-- Performance monitoring
CREATE TABLE IF NOT EXISTS request_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES scenario_runs(id),
  latency_ms INT NOT NULL,
  cache_status TEXT,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_metrics_created ON request_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_metrics_prediction ON request_metrics(prediction_id);

-- SLO breach detection function
CREATE OR REPLACE FUNCTION check_slo_breaches()
RETURNS TABLE(
  metric TEXT,
  current_value NUMERIC,
  threshold NUMERIC,
  status TEXT
) AS $$
BEGIN
  -- Hit rate check (7d vs 30d baseline)
  RETURN QUERY
  WITH hit_rates AS (
    SELECT 
      AVG(CASE WHEN so.correct THEN 1 ELSE 0 END) FILTER (WHERE so.recorded_at >= NOW() - INTERVAL '7 days') as hit_rate_7d,
      AVG(CASE WHEN so.correct THEN 1 ELSE 0 END) FILTER (WHERE so.recorded_at >= NOW() - INTERVAL '30 days') as hit_rate_30d
    FROM scenario_outcomes so
    WHERE so.recorded_at >= NOW() - INTERVAL '30 days'
  )
  SELECT 
    'hit_rate_7d_vs_30d'::TEXT,
    (hr.hit_rate_7d * 100)::NUMERIC,
    ((hr.hit_rate_30d - 0.05) * 100)::NUMERIC,
    CASE WHEN hr.hit_rate_7d < hr.hit_rate_30d - 0.05 THEN 'BREACH' ELSE 'OK' END::TEXT
  FROM hit_rates hr;

  -- Latency check
  RETURN QUERY
  SELECT 
    'p95_latency_ms'::TEXT,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY rm.latency_ms),
    700::NUMERIC,
    CASE WHEN PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY rm.latency_ms) > 700 THEN 'BREACH' ELSE 'OK' END::TEXT
  FROM request_metrics rm
  WHERE rm.created_at >= NOW() - INTERVAL '1 hour';

  -- Alert storm check
  RETURN QUERY
  SELECT 
    'max_alerts_per_hour'::TEXT,
    MAX(alert_count)::NUMERIC,
    2::NUMERIC,
    CASE WHEN MAX(alert_count) > 2 THEN 'BREACH' ELSE 'OK' END::TEXT
  FROM v_alert_storm_hourly
  WHERE hour >= NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Backfill function for missed outcomes
CREATE OR REPLACE FUNCTION backfill_missed_outcomes()
RETURNS INTEGER AS $$
DECLARE
  backfilled_count INTEGER := 0;
  prediction_record RECORD;
BEGIN
  FOR prediction_record IN
    SELECT 
      sr.id,
      sr.inputs->>'asset' as asset,
      sr.inputs->>'timeframe' as timeframe,
      (sr.outputs->>'deltaPct')::NUMERIC as expected_delta,
      sr.confidence,
      sr.created_at + CASE 
        WHEN sr.inputs->>'timeframe' = '2h' THEN INTERVAL '2 hours'
        WHEN sr.inputs->>'timeframe' = '6h' THEN INTERVAL '6 hours'  
        WHEN sr.inputs->>'timeframe' = '24h' THEN INTERVAL '24 hours'
        ELSE INTERVAL '6 hours'
      END as horizon_end
    FROM scenario_runs sr
    LEFT JOIN scenario_outcomes so ON sr.id = so.scenario_run_id
    WHERE so.id IS NULL
      AND sr.created_at + CASE 
        WHEN sr.inputs->>'timeframe' = '2h' THEN INTERVAL '2 hours'
        WHEN sr.inputs->>'timeframe' = '6h' THEN INTERVAL '6 hours'  
        WHEN sr.inputs->>'timeframe' = '24h' THEN INTERVAL '24 hours'
        ELSE INTERVAL '6 hours'
      END < NOW()
    LIMIT 100
  LOOP
    -- Mock realized outcome (in production, fetch from price API)
    INSERT INTO scenario_outcomes (
      scenario_run_id,
      expected_delta_pct,
      realized_delta_pct,
      confidence_level,
      correct,
      recorded_at
    ) VALUES (
      prediction_record.id,
      prediction_record.expected_delta,
      (RANDOM() - 0.5) * 8, -- Mock realized delta
      prediction_record.confidence,
      RANDOM() > 0.3, -- Mock 70% accuracy
      NOW()
    );
    
    backfilled_count := backfilled_count + 1;
  END LOOP;
  
  RETURN backfilled_count;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for monitoring tables
ALTER TABLE request_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages request metrics" ON request_metrics 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can read request metrics" ON request_metrics 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );