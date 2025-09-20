-- Simple validation script using only existing tables
-- Run these checks after deployment

-- 1. Check recent scenario runs
SELECT 
  'Recent Scenario Runs' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'INFO' END as status
FROM scenario_runs 
WHERE created_at >= NOW() - INTERVAL '2 hours';

-- 2. Check scenario outcomes exist
SELECT 
  'Scenario Outcomes' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'INFO' END as status
FROM scenario_outcomes 
WHERE recorded_at >= NOW() - INTERVAL '24 hours';

-- 3. Check explainers are present in recent runs
SELECT 
  'Explainers Present' as check_name,
  COUNT(*) FILTER (WHERE sr.outputs->>'explainer' IS NOT NULL) as with_explainer,
  COUNT(*) as total_runs,
  CASE 
    WHEN COUNT(*) = 0 THEN 'INFO'
    WHEN COUNT(*) FILTER (WHERE sr.outputs->>'explainer' IS NOT NULL) = COUNT(*) THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM scenario_runs sr
WHERE sr.created_at >= NOW() - INTERVAL '2 hours';

-- 4. Check for orphaned predictions
SELECT 
  'Orphaned Predictions' as check_name,
  COUNT(*) as orphan_count,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM scenario_runs sr
LEFT JOIN scenario_outcomes so ON sr.id = so.scenario_run_id
WHERE sr.created_at + INTERVAL '6 hours' < NOW() 
  AND so.id IS NULL;

-- 5. Check alert cooldowns table exists and has reasonable data
SELECT 
  'Alert System' as check_name,
  COUNT(*) as recent_alerts,
  CASE WHEN COUNT(*) < 50 THEN 'PASS' ELSE 'WARNING' END as status
FROM alert_cooldowns 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 6. Check model daily metrics
SELECT 
  'Model Metrics' as check_name,
  COUNT(*) as recent_metrics,
  CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'INFO' END as status
FROM model_daily_metrics 
WHERE day >= CURRENT_DATE - 7;

-- 7. System health summary
SELECT 
  'System Health Summary' as summary,
  (SELECT COUNT(*) FROM scenario_runs WHERE created_at >= NOW() - INTERVAL '24 hours') as runs_24h,
  (SELECT COUNT(*) FROM scenario_outcomes WHERE recorded_at >= NOW() - INTERVAL '24 hours') as outcomes_24h,
  (SELECT COUNT(*) FROM alert_cooldowns WHERE created_at >= NOW() - INTERVAL '24 hours') as alerts_24h,
  'Check individual queries above for details' as note;