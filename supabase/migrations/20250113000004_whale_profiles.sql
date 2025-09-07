-- Whale Profiles Database Schema
-- Create tables for detailed whale analysis and tracking

-- Whale profiles table for storing whale metadata
CREATE TABLE IF NOT EXISTS whale_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL,
  label TEXT,
  category TEXT, -- 'exchange', 'whale', 'defi', 'institution', 'unknown'
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_volume DECIMAL DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  balance_usd DECIMAL DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Whale transactions table for detailed transaction history
CREATE TABLE IF NOT EXISTS whale_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whale_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  block_number BIGINT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_address TEXT,
  token_symbol TEXT,
  token_name TEXT,
  amount DECIMAL NOT NULL,
  amount_usd DECIMAL NOT NULL,
  transaction_type TEXT, -- 'buy', 'sell', 'transfer', 'swap'
  exchange_name TEXT,
  gas_used BIGINT,
  gas_price DECIMAL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tx_hash, whale_address)
);

-- Whale portfolio table for current holdings
CREATE TABLE IF NOT EXISTS whale_portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whale_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_name TEXT,
  balance DECIMAL NOT NULL DEFAULT 0,
  balance_usd DECIMAL NOT NULL DEFAULT 0,
  avg_buy_price DECIMAL DEFAULT 0,
  total_bought DECIMAL DEFAULT 0,
  total_sold DECIMAL DEFAULT 0,
  pnl_usd DECIMAL DEFAULT 0,
  pnl_percentage DECIMAL DEFAULT 0,
  first_acquired TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(whale_address, chain, token_address)
);

-- Whale counterparties table for tracking interactions
CREATE TABLE IF NOT EXISTS whale_counterparties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whale_address TEXT NOT NULL,
  counterparty_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  interaction_count INTEGER DEFAULT 1,
  total_volume_usd DECIMAL DEFAULT 0,
  first_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  relationship_type TEXT, -- 'frequent', 'large_volume', 'recent'
  metadata JSONB DEFAULT '{}',
  UNIQUE(whale_address, counterparty_address, chain)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whale_profiles_address ON whale_profiles(address);
CREATE INDEX IF NOT EXISTS idx_whale_profiles_chain ON whale_profiles(chain);
CREATE INDEX IF NOT EXISTS idx_whale_profiles_category ON whale_profiles(category);
CREATE INDEX IF NOT EXISTS idx_whale_profiles_last_active ON whale_profiles(last_active);

CREATE INDEX IF NOT EXISTS idx_whale_transactions_whale_address ON whale_transactions(whale_address);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_chain ON whale_transactions(chain);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_timestamp ON whale_transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_tx_hash ON whale_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_token_symbol ON whale_transactions(token_symbol);

CREATE INDEX IF NOT EXISTS idx_whale_portfolios_whale_address ON whale_portfolios(whale_address);
CREATE INDEX IF NOT EXISTS idx_whale_portfolios_chain ON whale_portfolios(chain);
CREATE INDEX IF NOT EXISTS idx_whale_portfolios_balance_usd ON whale_portfolios(balance_usd);

CREATE INDEX IF NOT EXISTS idx_whale_counterparties_whale_address ON whale_counterparties(whale_address);
CREATE INDEX IF NOT EXISTS idx_whale_counterparties_interaction_count ON whale_counterparties(interaction_count);
CREATE INDEX IF NOT EXISTS idx_whale_counterparties_total_volume_usd ON whale_counterparties(total_volume_usd);

-- Enable RLS
ALTER TABLE whale_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_counterparties ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read access for whale data)
CREATE POLICY "Public read access for whale_profiles" ON whale_profiles FOR SELECT USING (true);
CREATE POLICY "Public read access for whale_transactions" ON whale_transactions FOR SELECT USING (true);
CREATE POLICY "Public read access for whale_portfolios" ON whale_portfolios FOR SELECT USING (true);
CREATE POLICY "Public read access for whale_counterparties" ON whale_counterparties FOR SELECT USING (true);

-- Service role can manage all data
CREATE POLICY "Service role can manage whale_profiles" ON whale_profiles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage whale_transactions" ON whale_transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage whale_portfolios" ON whale_portfolios FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage whale_counterparties" ON whale_counterparties FOR ALL USING (auth.role() = 'service_role');