-- Anomaly Detection System - Part 3
-- Views and statistics only

-- View for anomaly statistics
CREATE OR REPLACE VIEW anomaly_statistics AS
SELECT
  type,
  severity,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence,
  MIN(timestamp) as first_detected,
  MAX(timestamp) as last_detected,
  COUNT(*) FILTER (WHERE resolved = true) as resolved_count,
  COUNT(*) FILTER (WHERE resolved = false) as active_count
FROM anomaly_detections
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY type, severity
ORDER BY count DESC;

-- Grant access to view
GRANT SELECT ON anomaly_statistics TO authenticated;

