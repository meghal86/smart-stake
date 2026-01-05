CREATE TABLE IF NOT EXISTS whale_data_cache (
  whale_address TEXT PRIMARY KEY,
  chain TEXT NOT NULL,
  balance DECIMAL,
  transaction_count INTEGER,
  last_activity TIMESTAMP,
  risk_score DECIMAL,
  wallet_type TEXT,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes')
);

CREATE INDEX IF NOT EXISTS idx_whale_data_cache_expires ON whale_data_cache(expires_at);