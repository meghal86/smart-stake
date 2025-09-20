-- Post-deployment validation script
-- Run these checks after deploying to production

-- 1. Smoke Tests (10 minutes)

-- Confirm cron is firing and outcomes are being labeled
SELECT 
  NOW() as checked_at,
  COUNT(*) as outcomes_total,
  COUNT(*) FILTER (WHERE correct) as hits,
  COUNT(*) FILTER (WHERE NOT correct) as misses,
  MIN(recorded_at) as earliest_label,
  MAX(recorded_at) as latest_label
FROM scenario_outcomes
WHERE recorded_at >= NOW() - INTERVAL '2 hours';

-- No asset should exceed max 2 alerts / hour
WITH hourly_alerts AS (
  SELECT 
    asset, 
    DATE_TRUNC('hour', created_at) as hour, 
    COUNT(*) as alert_count
  FROM alert_cooldowns
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY asset, DATE_TRUNC('hour', created_at)
)
SELECT * FROM hourly_alerts 
WHERE alert_count > 2 
ORDER BY alert_count DESC 
LIMIT 20;

-- Check explainers are present
SELECT 
  sr.id,
  sr.inputs->>'asset' as asset,
  sr.inputs->>'timeframe' as timeframe,
  sr.confidence,
  sr.outputs->>'explainer' as explanation,
  CASE 
    WHEN sr.outputs->>'explainer' IS NOT NULL THEN 'PASS'
    ELSE 'FAIL'
  END as explainer_status
FROM scenario_runs sr
WHERE sr.created_at >= NOW() - INTERVAL '2 hours'
ORDER BY sr.created_at DESC
LIMIT 10;

-- 2. Integrity Checks

-- Check for orphaned predictions (should be 0 or very low)
SELECT COUNT(*) as overdue_unlabeled
FROM scenario_runs sr
LEFT JOIN scenario_outcomes so ON sr.id = so.scenario_run_id
WHERE sr.created_at + CASE 
  WHEN sr.inputs->>'timeframe' = '2h' THEN INTERVAL '2 hours'
  WHEN sr.inputs->>'timeframe' = '6h' THEN INTERVAL '6 hours'  
  WHEN sr.inputs->>'timeframe' = '24h' THEN INTERVAL '24 hours'
  ELSE INTERVAL '6 hours'
END < NOW() 
AND so.id IS NULL;

-- 3. Guardrail Acceptance Rate (should be 10-35%)
WITH eligible AS (
  SELECT sr.id, sr.inputs->>'asset' as asset
  FROM scenario_runs sr
  WHERE ABS((sr.outputs->>'deltaPct')::NUMERIC) >= 2.0 
    AND sr.confidence >= 0.70 
    AND sr.created_at >= NOW() - INTERVAL '24 hours'
),
emitted AS (
  SELECT DISTINCT asset
  FROM alert_cooldowns
  WHERE created_at >= NOW() - INTERVAL '24 hours'
)
SELECT 
  e.asset,
  COUNT(e.id) as eligible_signals,
  COUNT(em.asset) as fired_alerts,
  ROUND(COUNT(em.asset)::NUMERIC / NULLIF(COUNT(e.id), 0) * 100, 2) as acceptance_rate,
  CASE 
    WHEN ROUND(COUNT(em.asset)::NUMERIC / NULLIF(COUNT(e.id), 0) * 100, 2) BETWEEN 10 AND 35 THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM eligible e
LEFT JOIN emitted em ON e.asset = em.asset
GROUP BY e.asset;

-- 4. SLO Monitoring (Manual Check)
-- Hit rate check (7d vs 30d baseline)
WITH hit_rates AS (
  SELECT 
    AVG(CASE WHEN so.correct THEN 1 ELSE 0 END) FILTER (WHERE so.recorded_at >= NOW() - INTERVAL '7 days') as hit_rate_7d,
    AVG(CASE WHEN so.correct THEN 1 ELSE 0 END) FILTER (WHERE so.recorded_at >= NOW() - INTERVAL '30 days') as hit_rate_30d
  FROM scenario_outcomes so
  WHERE so.recorded_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  'hit_rate_7d_vs_30d' as metric,
  ROUND(hr.hit_rate_7d * 100, 2) as current_value,
  ROUND((hr.hit_rate_30d - 0.05) * 100, 2) as threshold,
  CASE WHEN hr.hit_rate_7d < hr.hit_rate_30d - 0.05 THEN 'BREACH' ELSE 'OK' END as status
FROM hit_rates hr;

-- 5. Performance Check (Basic)
-- Check recent scenario runs for performance indicators
SELECT 
  COUNT(*) as total_runs_1h,
  AVG(confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE confidence >= 0.7) as high_confidence_runs,
  ROUND(COUNT(*) FILTER (WHERE confidence >= 0.7)::NUMERIC / COUNT(*) * 100, 2) as high_confidence_rate
FROM scenario_runs
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- 6. Alert Storm Detection (Basic)
-- Check for excessive alerts in recent hours
WITH hourly_counts AS (
  SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    asset,
    COUNT(*) as alerts_per_hour
  FROM alert_cooldowns
  WHERE created_at >= NOW() - INTERVAL '6 hours'
  GROUP BY DATE_TRUNC('hour', created_at), asset
)
SELECT 
  hour,
  asset,
  alerts_per_hour,
  CASE 
    WHEN alerts_per_hour > 2 THEN 'STORM'
    WHEN alerts_per_hour = 2 THEN 'WARNING' 
    ELSE 'OK'
  END as status
FROM hourly_counts
WHERE alerts_per_hour > 0
ORDER BY hour DESC, alerts_per_hour DESC;

-- Expected Results:
-- ✅ outcomes_total > 0 (if any predictions made in last 2h)
-- ✅ No hourly_alerts with count > 2
-- ✅ All explainer_status = 'PASS'
-- ✅ overdue_unlabeled = 0 or < 5
-- ✅ acceptance_rate between 10-35%
-- ✅ All SLO checks status = 'OK'
-- ✅ high_confidence_rate > 60%
-- ✅ No alert storms with status = 'STORM'