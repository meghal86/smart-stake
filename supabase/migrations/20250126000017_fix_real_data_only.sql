-- Fix to use only real data from alerts table

-- 1. Direct chain risk from alerts (no dependencies)
DROP VIEW IF EXISTS chain_risk_simple CASCADE;
CREATE VIEW chain_risk_simple AS
WITH alerts_24h AS (
  SELECT 
    COALESCE(chain, 'UNKNOWN') as chain,
    COUNT(DISTINCT from_addr) AS whale_count,
    SUM(amount_usd) AS total_volume,
    COUNT(*) AS tx_count,
    AVG(amount_usd) AS avg_amount
  FROM alerts
  WHERE created_at >= NOW() - INTERVAL '24 hours'
    AND amount_usd > 0
  GROUP BY chain
  HAVING COUNT(*) > 0
)
SELECT
  chain,
  -- Simple risk calculation from real data
  LEAST(100, GREATEST(0, 
    ROUND(
      (whale_count::float / 10.0) * 30 +  -- More whales = higher risk
      (total_volume::float / 10000000.0) * 40 +  -- Higher volume = higher risk  
      (tx_count::float / 50.0) * 30  -- More transactions = higher risk
    )
  )) AS risk_0_100,
  -- Components
  LEAST(1.0, whale_count::float / 10.0) AS flow_component,
  LEAST(1.0, total_volume::float / 10000000.0) AS concentration_component,
  LEAST(1.0, tx_count::float / 50.0) AS inactivity_component,
  -- Band
  CASE
    WHEN LEAST(100, GREATEST(0, 
      ROUND(
        (whale_count::float / 10.0) * 30 +
        (total_volume::float / 10000000.0) * 40 +
        (tx_count::float / 50.0) * 30
      )
    )) <= 33 THEN 'Safe'
    WHEN LEAST(100, GREATEST(0, 
      ROUND(
        (whale_count::float / 10.0) * 30 +
        (total_volume::float / 10000000.0) * 40 +
        (tx_count::float / 50.0) * 30
      )
    )) <= 66 THEN 'Watch'
    ELSE 'High'
  END AS band,
  whale_count,
  tx_count,
  total_volume AS volume_24h,
  NOW() AS refreshed_at
FROM alerts_24h;

-- 2. Direct cluster percentages from alerts
DROP VIEW IF EXISTS cluster_percentages CASCADE;
CREATE VIEW cluster_percentages AS
WITH classified_alerts AS (
  SELECT 
    id,
    chain,
    amount_usd,
    CASE 
      WHEN amount_usd >= 10000000 THEN 'DORMANT_WAKING'
      WHEN to_addr ILIKE '%binance%' OR to_addr ILIKE '%coinbase%' OR to_addr ILIKE '%kraken%' THEN 'CEX_INFLOW'
      WHEN amount_usd >= 2000000 THEN 'DISTRIBUTION'
      WHEN amount_usd >= 1000000 THEN 'DEFI_ACTIVITY'
      ELSE 'ACCUMULATION'
    END AS cluster_type
  FROM alerts
  WHERE created_at >= NOW() - INTERVAL '24 hours'
    AND amount_usd > 0
),
cluster_totals AS (
  SELECT 
    cluster_type,
    SUM(amount_usd) AS cluster_flow,
    COUNT(*) AS tx_count
  FROM classified_alerts
  GROUP BY cluster_type
),
total_flow AS (
  SELECT SUM(amount_usd) AS all_flow FROM classified_alerts
)
SELECT
  c.cluster_type,
  c.cluster_flow,
  c.tx_count,
  ROUND(100.0 * c.cluster_flow / NULLIF(t.all_flow, 0), 1) AS pct_of_total
FROM cluster_totals c 
CROSS JOIN total_flow t
WHERE c.cluster_flow > 0
ORDER BY c.cluster_flow DESC;

-- 3. Direct market summary from alerts
DROP VIEW IF EXISTS market_summary_real CASCADE;
CREATE VIEW market_summary_real AS
SELECT
  COALESCE(SUM(amount_usd), 0) AS volume_24h,
  COALESCE(COUNT(DISTINCT from_addr), 0) AS active_whales_24h,
  COALESCE(COUNT(DISTINCT chain), 0) AS chains_tracked,
  COALESCE(MAX(created_at), NOW()) AS refreshed_at
FROM alerts
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND amount_usd > 0;