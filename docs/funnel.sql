-- AlphaWhale Stickiness & Conversion Funnel Analysis
-- First create the telemetry_events table, then run the views

-- Create telemetry_events table
CREATE TABLE IF NOT EXISTS telemetry_events (
  id SERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  session_id TEXT,
  properties JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_events_timestamp ON telemetry_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_event ON telemetry_events(event);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_session ON telemetry_events(session_id);

-- Daily Event Counts
CREATE OR REPLACE VIEW daily_events AS
SELECT 
  DATE(timestamp) as event_date,
  event,
  COUNT(*) as event_count,
  COUNT(DISTINCT session_id) as unique_sessions
FROM telemetry_events 
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp), event
ORDER BY event_date DESC, event_count DESC;

-- Engagement Funnel (Daily)
CREATE OR REPLACE VIEW engagement_funnel AS
WITH daily_sessions AS (
  SELECT 
    DATE(timestamp) as event_date,
    session_id,
    MAX(CASE WHEN event = 'page_view' THEN 1 ELSE 0 END) as viewed_page,
    MAX(CASE WHEN event = 'follow_whale' THEN 1 ELSE 0 END) as followed_whale,
    MAX(CASE WHEN event = 'create_alert_open' THEN 1 ELSE 0 END) as opened_alert_modal,
    MAX(CASE WHEN event = 'alert_created' THEN 1 ELSE 0 END) as created_alert,
    MAX(CASE WHEN event = 'share_spotlight' THEN 1 ELSE 0 END) as shared_content,
    MAX(CASE WHEN event = 'upgrade_click' THEN 1 ELSE 0 END) as clicked_upgrade
  FROM telemetry_events 
  WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(timestamp), session_id
)
SELECT 
  event_date,
  COUNT(*) as total_sessions,
  SUM(viewed_page) as viewed_page,
  SUM(followed_whale) as followed_whale,
  SUM(opened_alert_modal) as opened_alert_modal,
  SUM(created_alert) as created_alert,
  SUM(shared_content) as shared_content,
  SUM(clicked_upgrade) as clicked_upgrade,
  
  -- Conversion rates
  ROUND(100.0 * SUM(followed_whale) / COUNT(*), 2) as follow_rate_pct,
  ROUND(100.0 * SUM(created_alert) / COUNT(*), 2) as alert_creation_rate_pct,
  ROUND(100.0 * SUM(shared_content) / COUNT(*), 2) as share_rate_pct,
  ROUND(100.0 * SUM(clicked_upgrade) / COUNT(*), 2) as upgrade_click_rate_pct
FROM daily_sessions
GROUP BY event_date
ORDER BY event_date DESC;

-- Feature Adoption Rates
CREATE OR REPLACE VIEW feature_adoption AS
SELECT 
  'For You Row' as feature,
  COUNT(DISTINCT session_id) as unique_users,
  COUNT(*) as total_interactions
FROM telemetry_events 
WHERE event IN ('follow_whale', 'create_alert_open', 'share_spotlight')
  AND properties->>'source' = 'for_you'
  AND timestamp >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
  'Alerts Feed' as feature,
  COUNT(DISTINCT session_id) as unique_users,
  COUNT(*) as total_interactions
FROM telemetry_events 
WHERE event IN ('create_alert_open', 'alert_created')
  AND properties->>'source' = 'alerts_feed'
  AND timestamp >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
  'Pro Teaser' as feature,
  COUNT(DISTINCT session_id) as unique_users,
  COUNT(*) as total_interactions
FROM telemetry_events 
WHERE event = 'upgrade_click'
  AND properties->>'source' = 'pro_teaser'
  AND timestamp >= CURRENT_DATE - INTERVAL '7 days';

-- Stickiness Metrics (DAU/WAU/MAU)
CREATE OR REPLACE VIEW stickiness_metrics AS
WITH user_activity AS (
  SELECT 
    session_id,
    DATE(timestamp) as activity_date,
    COUNT(*) as daily_events
  FROM telemetry_events 
  WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY session_id, DATE(timestamp)
)
SELECT 
  'Daily Active Users' as metric,
  COUNT(DISTINCT session_id) as value
FROM user_activity 
WHERE activity_date = CURRENT_DATE - INTERVAL '1 day'

UNION ALL

SELECT 
  'Weekly Active Users' as metric,
  COUNT(DISTINCT session_id) as value
FROM user_activity 
WHERE activity_date >= CURRENT_DATE - INTERVAL '7 days'

UNION ALL

SELECT 
  'Monthly Active Users' as metric,
  COUNT(DISTINCT session_id) as value
FROM user_activity 
WHERE activity_date >= CURRENT_DATE - INTERVAL '30 days';

-- Usage Examples:
-- SELECT * FROM daily_events WHERE event_date = CURRENT_DATE - INTERVAL '1 day';
-- SELECT * FROM engagement_funnel ORDER BY event_date DESC LIMIT 7;
-- SELECT * FROM feature_adoption;
-- SELECT * FROM stickiness_metrics;