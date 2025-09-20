-- Attribution system verification queries
-- Run these to validate attribution is working correctly

-- 1) Check upgrade attribution coverage
SELECT
  COUNT(*) as upgrades,
  COUNT(*) FILTER (WHERE last_preset_key IS NOT NULL) as with_preset,
  COUNT(*) FILTER (WHERE last_lock_key IS NOT NULL) as with_lock,
  ROUND(100.0 * COUNT(*) FILTER (WHERE last_preset_key IS NOT NULL)/COUNT(*), 1) as pct_with_preset,
  ROUND(100.0 * COUNT(*) FILTER (WHERE last_lock_key IS NOT NULL)/COUNT(*), 1) as pct_with_lock
FROM upgrade_events
WHERE occurred_at >= NOW() - INTERVAL '30 days';

-- 2) Verify windowing works (72h preset, 24h lock)
SELECT 
  u.user_id, 
  u.occurred_at,
  u.last_preset_key,
  u.last_lock_key,
  pc.occurred_at as last_preset_time,
  fl.occurred_at as last_lock_time,
  EXTRACT(EPOCH FROM (u.occurred_at - pc.occurred_at))/3600 as preset_hours_ago,
  EXTRACT(EPOCH FROM (u.occurred_at - fl.occurred_at))/3600 as lock_hours_ago
FROM upgrade_events u
LEFT JOIN preset_click_events pc ON pc.user_id = u.user_id 
  AND pc.preset_key = u.last_preset_key
  AND pc.occurred_at <= u.occurred_at
LEFT JOIN feature_lock_events fl ON fl.user_id = u.user_id 
  AND fl.lock_key = u.last_lock_key
  AND fl.occurred_at <= u.occurred_at
WHERE u.occurred_at >= NOW() - INTERVAL '7 days'
ORDER BY u.occurred_at DESC
LIMIT 20;

-- 3) Check last-touch attribution (most recent wins)
WITH recent_clicks AS (
  SELECT 
    user_id, 
    preset_key, 
    occurred_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY occurred_at DESC) as rn
  FROM preset_click_events
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  u.user_id,
  u.last_preset_key,
  c.preset_key as most_recent_click,
  CASE 
    WHEN u.last_preset_key = c.preset_key THEN 'CORRECT'
    ELSE 'MISMATCH'
  END as attribution_status
FROM upgrade_events u
JOIN recent_clicks c ON c.user_id = u.user_id AND c.rn = 1
WHERE u.occurred_at >= NOW() - INTERVAL '30 days'
  AND u.last_preset_key IS NOT NULL
LIMIT 50;

-- 4) Preset funnel analysis
WITH preset_users AS (
  SELECT DISTINCT user_id, preset_key
  FROM preset_click_events
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  p.preset_key,
  COUNT(*) as click_users,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM upgrade_events u
    WHERE u.user_id = p.user_id
      AND u.occurred_at BETWEEN NOW() - INTERVAL '30 days' AND NOW()
      AND u.last_preset_key = p.preset_key
  )) as upgrades,
  ROUND(100.0 * COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM upgrade_events u
    WHERE u.user_id = p.user_id
      AND u.occurred_at BETWEEN NOW() - INTERVAL '30 days' AND NOW()
      AND u.last_preset_key = p.preset_key
  )) / COUNT(*), 1) as conv_pct
FROM preset_users p
GROUP BY p.preset_key
ORDER BY conv_pct DESC NULLS LAST;

-- 5) Feature lock funnel analysis
WITH lock_users AS (
  SELECT DISTINCT user_id, lock_key
  FROM feature_lock_events
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
)
SELECT 
  l.lock_key,
  COUNT(*) as lock_users,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM upgrade_events u
    WHERE u.user_id = l.user_id
      AND u.occurred_at BETWEEN NOW() - INTERVAL '30 days' AND NOW()
      AND u.last_lock_key = l.lock_key
  )) as upgrades,
  ROUND(100.0 * COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM upgrade_events u
    WHERE u.user_id = l.user_id
      AND u.occurred_at BETWEEN NOW() - INTERVAL '30 days' AND NOW()
      AND u.last_lock_key = l.lock_key
  )) / COUNT(*), 1) as conv_pct
FROM lock_users l
GROUP BY l.lock_key
ORDER BY conv_pct DESC NULLS LAST;

-- Expected Results:
-- ✅ pct_with_preset > 60% (good attribution coverage)
-- ✅ pct_with_lock > 40% (reasonable paywall encounters)
-- ✅ preset_hours_ago < 72, lock_hours_ago < 24 (windowing works)
-- ✅ attribution_status = 'CORRECT' for most rows (last-touch works)
-- ✅ conv_pct varies by preset/lock (realistic funnel data)