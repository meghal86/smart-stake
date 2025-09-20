-- Price Provider System with Dual Failover
-- CoinGecko Primary, CoinMarketCap Backup

-- Price cache table
CREATE TABLE IF NOT EXISTS price_cache (
  id SERIAL PRIMARY KEY,
  asset TEXT NOT NULL,
  price_usd NUMERIC NOT NULL,
  provider TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ttl_seconds INT NOT NULL DEFAULT 15
);

CREATE INDEX IF NOT EXISTS price_cache_asset_idx ON price_cache(asset);
CREATE INDEX IF NOT EXISTS price_cache_fetched_idx ON price_cache(fetched_at DESC);

-- Provider usage tracking for rate limits
CREATE TABLE IF NOT EXISTS provider_usage (
  id SERIAL PRIMARY KEY,
  provider TEXT NOT NULL, -- 'coingecko' | 'cmc'
  minute_window TIMESTAMPTZ NOT NULL, -- floor to minute
  day_window DATE NOT NULL, -- UTC day
  calls INT NOT NULL DEFAULT 0,
  UNIQUE(provider, minute_window, day_window)
);

CREATE INDEX IF NOT EXISTS provider_usage_idx ON provider_usage(provider, day_window, minute_window);

-- RLS policies
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read price cache" ON price_cache FOR SELECT USING (true);
CREATE POLICY "Service role write price cache" ON price_cache FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Public read provider usage" ON provider_usage FOR SELECT USING (true);
CREATE POLICY "Service role write provider usage" ON provider_usage FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');