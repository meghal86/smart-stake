-- Fix-Only: Correct data issues without rebuilding

-- 1. Real Chain Risk View (replaces mock data)
DROP VIEW IF EXISTS chain_risk_simple CASCADE;
CREATE VIEW chain_risk_simple AS
WITH f AS (
  SELECT 
    COALESCE(chain, 'UNKNOWN') as chain,
    COALESCE(whale_count, 0) AS whale_count,
    COALESCE(total_inflow, 0) AS total_inflow,
    COALESCE(total_outflow, 0) AS total_outflow,
    COALESCE(net_flow, 0) AS net_flow,
    COALESCE(tx_count, 0) AS tx_count
  FROM chain_features_24h
),
-- Use alerts table as whale_balances proxy
bal AS (
  SELECT 
    chain,
    SUM(amount_usd) AS total_bal,
    SUM(amount_usd) FILTER (WHERE rn <= 3) AS top3_bal
  FROM (
    SELECT 
      chain, 
      amount_usd,
      ROW_NUMBER() OVER (PARTITION BY chain ORDER BY amount_usd DESC) rn
    FROM alerts
    WHERE created_at >= NOW() - INTERVAL '24 hours'
  ) x
  GROUP BY chain
),
-- Activity from recent alerts
act AS (
  SELECT 
    chain,
    COUNT(DISTINCT from_addr) AS active_whales,
    COUNT(DISTINCT from_addr) AS total_whales
  FROM alerts
  WHERE created_at >= NOW() - INTERVAL '30 days'
  GROUP BY chain
)
SELECT
  f.chain,
  -- Components in [0..1]
  COALESCE(ABS(f.net_flow)::numeric / NULLIF(f.total_inflow + f.total_outflow, 0), 0) AS flow_component,
  COALESCE(bal.top3_bal::numeric / NULLIF(bal.total_bal, 0), 0) AS concentration_component,
  COALESCE(1 - act.active_whales::numeric / NULLIF(act.total_whales, 0), 0) AS inactivity_component,
  -- Weighted score 0..100
  LEAST(100, GREATEST(0, ROUND(100 * (
     0.50 * COALESCE(ABS(f.net_flow)::numeric / NULLIF(f.total_inflow + f.total_outflow, 0), 0) +
     0.30 * COALESCE(bal.top3_bal::numeric / NULLIF(bal.total_bal, 0), 0) +
     0.20 * COALESCE(1 - act.active_whales::numeric / NULLIF(act.total_whales, 0), 0)
  )))) AS risk_0_100,
  CASE
    WHEN LEAST(100, GREATEST(0, ROUND(100 * (
       0.50 * COALESCE(ABS(f.net_flow)::numeric / NULLIF(f.total_inflow + f.total_outflow, 0), 0) +
       0.30 * COALESCE(bal.top3_bal::numeric / NULLIF(bal.total_bal, 0), 0) +
       0.20 * COALESCE(1 - act.active_whales::numeric / NULLIF(act.total_whales, 0), 0)
    )))) <= 33 THEN 'Safe'
    WHEN LEAST(100, GREATEST(0, ROUND(100 * (
       0.50 * COALESCE(ABS(f.net_flow)::numeric / NULLIF(f.total_inflow + f.total_outflow, 0), 0) +
       0.30 * COALESCE(bal.top3_bal::numeric / NULLIF(bal.total_bal, 0), 0) +
       0.20 * COALESCE(1 - act.active_whales::numeric / NULLIF(act.total_whales, 0), 0)
    )))) <= 66 THEN 'Watch'
    ELSE 'High'
  END AS band,
  f.whale_count,
  f.tx_count,
  ABS(f.net_flow) AS volume_24h,
  NOW() AS refreshed_at
FROM f
LEFT JOIN bal ON bal.chain = f.chain
LEFT JOIN act ON act.chain = f.chain
WHERE f.whale_count > 0 OR f.tx_count > 0;

-- 2. Deduped Cluster Percentages
CREATE OR REPLACE VIEW cluster_percentages AS
WITH base AS (
  SELECT DISTINCT
    id,
    chain,
    amount_usd,
    CASE 
      WHEN amount_usd >= 10000000 THEN 'DORMANT_WAKING'
      WHEN to_addr IN (SELECT DISTINCT to_addr FROM alerts WHERE to_addr LIKE '%binance%' OR to_addr LIKE '%coinbase%') THEN 'CEX_INFLOW'
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
  FROM base
  GROUP BY cluster_type
),
total_flow AS (
  SELECT SUM(amount_usd) AS all_flow FROM base
)
SELECT
  c.cluster_type,
  c.cluster_flow,
  c.tx_count,
  ROUND(100.0 * c.cluster_flow / NULLIF(t.all_flow, 0), 1) AS pct_of_total
FROM cluster_totals c 
CROSS JOIN total_flow t
ORDER BY c.cluster_flow DESC;

-- 3. Market Summary Aggregation
CREATE OR REPLACE VIEW market_summary_real AS
SELECT
  COALESCE(SUM(total_inflow + total_outflow), 0) AS volume_24h,
  COALESCE(SUM(whale_count), 0) AS active_whales_24h,
  COALESCE(COUNT(DISTINCT chain), 0) AS chains_tracked,
  COALESCE(MAX(refreshed_at), NOW()) AS refreshed_at
FROM chain_features_24h;