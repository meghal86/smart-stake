-- Refresh materialized views
REFRESH MATERIALIZED VIEW chain_features_24h;
REFRESH MATERIALIZED VIEW chain_risk_normalized;
REFRESH MATERIALIZED VIEW cluster_chain_correlation_hourly;

-- Call the refresh function
SELECT refresh_market_views();