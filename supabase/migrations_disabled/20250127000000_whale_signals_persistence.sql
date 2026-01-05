-- Create whale_signals table for persistent storage
CREATE TABLE IF NOT EXISTS whale_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT UNIQUE NOT NULL,
  from_addr TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  amount_usd NUMERIC NOT NULL,
  token TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'ethereum',
  tx_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'transfer'
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT whale_signals_tx_hash_unique UNIQUE (tx_hash)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_whale_signals_timestamp ON whale_signals (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whale_signals_token ON whale_signals (token);
CREATE INDEX IF NOT EXISTS idx_whale_signals_amount ON whale_signals (amount_usd DESC);
CREATE INDEX IF NOT EXISTS idx_whale_signals_created_at ON whale_signals (created_at);

-- RLS policies
ALTER TABLE whale_signals ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users
CREATE POLICY "whale_signals_read" ON whale_signals
  FOR SELECT USING (true);

-- Function to cleanup old records (30+ days)
CREATE OR REPLACE FUNCTION cleanup_old_whale_signals()
RETURNS void AS $$
BEGIN
  DELETE FROM whale_signals 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;