-- Copy and paste this into Supabase SQL Editor
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

CREATE TABLE IF NOT EXISTS provider_usage (
  id SERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  minute_window TIMESTAMPTZ NOT NULL,
  day_window DATE NOT NULL,
  calls INT NOT NULL DEFAULT 0,
  UNIQUE(provider, minute_window, day_window)
);

CREATE INDEX IF NOT EXISTS provider_usage_idx ON provider_usage(provider, day_window, minute_window);

ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read price cache" ON price_cache FOR SELECT USING (true);
CREATE POLICY "Public read provider usage" ON provider_usage FOR SELECT USING (true);