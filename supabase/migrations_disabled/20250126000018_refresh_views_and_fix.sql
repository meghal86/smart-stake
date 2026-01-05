-- Refresh materialized views and fix data flow

-- 1. Refresh materialized views to get latest whale data
REFRESH MATERIALIZED VIEW chain_features_24h;
REFRESH MATERIALIZED VIEW chain_risk_normalized;
REFRESH MATERIALIZED VIEW cluster_chain_correlation_hourly;

-- 2. Ensure we have some basic data for testing
-- This will only insert if no data exists
DO $$
BEGIN
  -- Check if chain_features_24h is empty and populate from alerts
  IF NOT EXISTS (SELECT 1 FROM chain_features_24h LIMIT 1) THEN
    INSERT INTO chain_features_24h
    SELECT 
      COALESCE(chain, 'ETH') as chain,
      COUNT(DISTINCT from_addr) AS whale_count,
      SUM(amount_usd) AS total_inflow,
      0 AS total_outflow,
      SUM(amount_usd) AS net_flow,
      COUNT(*) AS tx_count,
      MAX(created_at) AS refreshed_at
    FROM alerts
    WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND amount_usd > 0
    GROUP BY chain
    HAVING COUNT(*) > 0;
  END IF;
END $$;

-- 3. Create a function to auto-refresh views
CREATE OR REPLACE FUNCTION auto_refresh_market_views()
RETURNS void AS $$
BEGIN
  -- Refresh materialized views
  REFRESH MATERIALIZED VIEW chain_features_24h;
  REFRESH MATERIALIZED VIEW chain_risk_normalized;
  REFRESH MATERIALIZED VIEW cluster_chain_correlation_hourly;
  
  -- Update chain_features_24h from latest alerts if empty
  DELETE FROM chain_features_24h WHERE refreshed_at < NOW() - INTERVAL '1 hour';
  
  INSERT INTO chain_features_24h
  SELECT 
    COALESCE(chain, 'ETH') as chain,
    COUNT(DISTINCT from_addr) AS whale_count,
    SUM(amount_usd) AS total_inflow,
    0 AS total_outflow,
    SUM(amount_usd) AS net_flow,
    COUNT(*) AS tx_count,
    MAX(created_at) AS refreshed_at
  FROM alerts
  WHERE created_at >= NOW() - INTERVAL '24 hours'
    AND amount_usd > 0
  GROUP BY chain
  HAVING COUNT(*) > 0
  ON CONFLICT (chain) DO UPDATE SET
    whale_count = EXCLUDED.whale_count,
    total_inflow = EXCLUDED.total_inflow,
    net_flow = EXCLUDED.net_flow,
    tx_count = EXCLUDED.tx_count,
    refreshed_at = EXCLUDED.refreshed_at;
END;
$$ LANGUAGE plpgsql;

-- 4. Call the refresh function
SELECT auto_refresh_market_views();