-- Data Quality Views for AlphaWhale
-- Run this migration in Supabase SQL Editor

-- Events invariants view
CREATE OR REPLACE VIEW v_events_invariants AS
SELECT
  count(*) AS total,
  sum((amount_usd < 0)::int) AS neg_usd,
  sum((tx_hash IS NULL OR tx_hash='')::int) AS missing_tx,
  sum((wallet_hash IS NULL OR wallet_hash='')::int) AS missing_wallet
FROM events_whale;

-- Data freshness view
CREATE OR REPLACE VIEW v_freshness AS
SELECT extract(epoch from (now() - max(ts)))::int AS latest_event_age_sec 
FROM events_whale;

-- Provenance ratio by hour
CREATE OR REPLACE VIEW v_provenance_ratio_hourly AS
SELECT 
  date_trunc('hour', ts) h, 
  avg((meta->>'provenance')='Real')::float AS real_ratio
FROM events_whale 
GROUP BY 1 
ORDER BY 1 DESC 
LIMIT 48;

-- 24h volume view
CREATE OR REPLACE VIEW v_volume_24h AS
SELECT sum(amount_usd)::float as vol_24h 
FROM events_whale 
WHERE ts > now() - interval '24 hours';

-- Price sanity check function
CREATE OR REPLACE FUNCTION fn_price_sanity(asset text, observed numeric)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  cached_price numeric;
  tolerance numeric := 0.1; -- 10%
BEGIN
  -- Simple cache check (in production, use Redis or similar)
  SELECT price INTO cached_price 
  FROM price_cache 
  WHERE symbol = asset 
    AND updated_at > now() - interval '5 minutes'
  LIMIT 1;
  
  -- If no cached price, assume valid (fallback)
  IF cached_price IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check if observed price is within 10% of cached price
  RETURN abs(observed - cached_price) / cached_price <= tolerance;
END;
$$;

-- QC runs table for reconciliation results
CREATE TABLE IF NOT EXISTS qc_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at timestamptz DEFAULT now(),
  windows jsonb,
  status text CHECK (status IN ('success', 'failed', 'partial')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Price cache table for sanity checks
CREATE TABLE IF NOT EXISTS price_cache (
  symbol text PRIMARY KEY,
  price numeric NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Events whale table (if not exists)
CREATE TABLE IF NOT EXISTS events_whale (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash text,
  log_index integer,
  wallet_hash text,
  amount_usd numeric,
  ts timestamptz,
  meta jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tx_hash, log_index)
);