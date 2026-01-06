-- Simple refresh without trying to modify materialized views

-- 1. Just refresh the materialized views
REFRESH MATERIALIZED VIEW chain_features_24h;
REFRESH MATERIALIZED VIEW chain_risk_normalized;

-- 2. Simple refresh function
CREATE OR REPLACE FUNCTION refresh_market_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW chain_features_24h;
  REFRESH MATERIALIZED VIEW chain_risk_normalized;
  REFRESH MATERIALIZED VIEW cluster_chain_correlation_hourly;
END;
$$ LANGUAGE plpgsql;