-- =====================================================
-- Whale Analytics Production Schema
-- =====================================================
-- This migration creates the production-ready schema for whale analytics
-- including balance tracking, transfer monitoring, and signal generation.

-- =====================================================
-- 1. WHALE BALANCES TABLE
-- =====================================================
-- Stores whale wallet balance snapshots from various blockchain providers
CREATE TABLE IF NOT EXISTS whale_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,                    -- Whale wallet address
    chain TEXT NOT NULL,                      -- Blockchain network (ethereum, polygon, etc.)
    balance DECIMAL(36,18) NOT NULL,          -- Balance amount with high precision
    ts TIMESTAMP NOT NULL,                    -- Timestamp when balance was recorded on-chain
    provider TEXT NOT NULL,                   -- Data provider (alchemy, moralis, etc.)
    method TEXT NOT NULL,                     -- API method used (eth_getBalance, etc.)
    request_id TEXT,                          -- Unique request identifier for debugging
    ingested_at TIMESTAMP DEFAULT NOW(),      -- When data was ingested into our system
    latency_ms INTEGER,                       -- API response time in milliseconds
    
    -- Constraints
    CONSTRAINT whale_balances_chain_check CHECK (chain IN ('ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum')),
    CONSTRAINT whale_balances_provider_check CHECK (provider IN ('alchemy', 'moralis', 'etherscan', 'quicknode')),
    CONSTRAINT whale_balances_balance_positive CHECK (balance >= 0),
    CONSTRAINT whale_balances_latency_positive CHECK (latency_ms >= 0)
);

-- =====================================================
-- 2. WHALE TRANSFERS TABLE  
-- =====================================================
-- Stores whale transaction/transfer data for activity monitoring
CREATE TABLE IF NOT EXISTS whale_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT NOT NULL,                    -- Transaction hash
    log_index INTEGER NOT NULL DEFAULT 0,    -- Log index within transaction (for ERC-20 transfers)
    from_address TEXT NOT NULL,               -- Sender address
    to_address TEXT NOT NULL,                 -- Recipient address
    value DECIMAL(36,18) NOT NULL,            -- Transfer amount with high precision
    token TEXT NOT NULL DEFAULT 'ETH',       -- Token symbol (ETH, USDC, etc.)
    chain TEXT NOT NULL,                      -- Blockchain network
    ts TIMESTAMP NOT NULL,                    -- Transaction timestamp
    provider TEXT NOT NULL,                   -- Data provider
    method TEXT NOT NULL,                     -- API method used
    request_id TEXT,                          -- Request identifier
    ingested_at TIMESTAMP DEFAULT NOW(),      -- Ingestion timestamp
    latency_ms INTEGER,                       -- API latency
    
    -- Constraints
    CONSTRAINT whale_transfers_unique_tx UNIQUE (tx_hash, log_index), -- Idempotency constraint
    CONSTRAINT whale_transfers_chain_check CHECK (chain IN ('ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum')),
    CONSTRAINT whale_transfers_provider_check CHECK (provider IN ('alchemy', 'moralis', 'etherscan', 'quicknode')),
    CONSTRAINT whale_transfers_value_positive CHECK (value >= 0),
    CONSTRAINT whale_transfers_latency_positive CHECK (latency_ms >= 0)
);

-- =====================================================
-- 3. WHALE SIGNALS TABLE
-- =====================================================
-- Stores generated signals and alerts based on whale behavior analysis
CREATE TABLE IF NOT EXISTS whale_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,                    -- Whale address that triggered the signal
    chain TEXT NOT NULL,                      -- Blockchain network
    signal_type TEXT NOT NULL,                -- Type of signal (accumulation, distribution, etc.)
    value DECIMAL(36,18),                     -- Numeric value associated with signal
    confidence FLOAT NOT NULL,                -- Confidence score (0.0 to 1.0)
    reasons TEXT[] DEFAULT '{}',              -- Array of reasons for the signal
    supporting_events TEXT[] DEFAULT '{}',    -- Array of supporting transaction hashes
    ts TIMESTAMP NOT NULL,                    -- Signal generation timestamp
    provider TEXT NOT NULL,                   -- Data provider that generated signal
    method TEXT NOT NULL,                     -- Analysis method used
    ingested_at TIMESTAMP DEFAULT NOW(),      -- When signal was stored
    
    -- Constraints
    CONSTRAINT whale_signals_chain_check CHECK (chain IN ('ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum')),
    CONSTRAINT whale_signals_signal_type_check CHECK (signal_type IN ('accumulation', 'distribution', 'whale_alert', 'unusual_activity', 'large_transfer')),
    CONSTRAINT whale_signals_confidence_range CHECK (confidence >= 0.0 AND confidence <= 1.0),
    CONSTRAINT whale_signals_value_positive CHECK (value IS NULL OR value >= 0)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Whale Balances Indexes
CREATE INDEX idx_whale_balances_address_chain ON whale_balances(address, chain);
CREATE INDEX idx_whale_balances_ts ON whale_balances(ts DESC);
CREATE INDEX idx_whale_balances_provider ON whale_balances(provider);

-- Whale Transfers Indexes  
CREATE INDEX idx_whale_transfers_from_address_chain ON whale_transfers(from_address, chain);
CREATE INDEX idx_whale_transfers_to_address_chain ON whale_transfers(to_address, chain);
CREATE INDEX idx_whale_transfers_ts ON whale_transfers(ts DESC);
CREATE INDEX idx_whale_transfers_token ON whale_transfers(token);
CREATE INDEX idx_whale_transfers_value ON whale_transfers(value DESC);

-- Whale Signals Indexes
CREATE INDEX idx_whale_signals_address_chain ON whale_signals(address, chain);
CREATE INDEX idx_whale_signals_ts ON whale_signals(ts DESC);
CREATE INDEX idx_whale_signals_signal_type ON whale_signals(signal_type);
CREATE INDEX idx_whale_signals_confidence ON whale_signals(confidence DESC);

-- Partial index for high-confidence signals
CREATE INDEX idx_whale_signals_high_confidence ON whale_signals(address, chain, ts) 
WHERE confidence >= 0.8;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE whale_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_transfers ENABLE ROW LEVEL SECURITY;  
ALTER TABLE whale_signals ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for backend functions)
CREATE POLICY "Service role full access on whale_balances" ON whale_balances
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on whale_transfers" ON whale_transfers
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on whale_signals" ON whale_signals
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users read access
CREATE POLICY "Authenticated users can read whale_balances" ON whale_balances
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read whale_transfers" ON whale_transfers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read whale_signals" ON whale_signals
    FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE whale_balances IS 'Stores whale wallet balance snapshots from blockchain APIs for tracking wealth changes over time';
COMMENT ON TABLE whale_transfers IS 'Stores whale transaction and transfer data for activity monitoring and pattern analysis';  
COMMENT ON TABLE whale_signals IS 'Stores generated signals and alerts based on whale behavior analysis and anomaly detection';

COMMENT ON COLUMN whale_balances.address IS 'Whale wallet address (checksummed format)';
COMMENT ON COLUMN whale_balances.chain IS 'Blockchain network identifier';
COMMENT ON COLUMN whale_balances.balance IS 'Wallet balance in native token units (ETH, MATIC, etc.)';
COMMENT ON COLUMN whale_balances.ts IS 'Block timestamp when balance was recorded on-chain';
COMMENT ON COLUMN whale_balances.provider IS 'Blockchain data provider (alchemy, moralis, etc.)';
COMMENT ON COLUMN whale_balances.latency_ms IS 'API response time for performance monitoring';

COMMENT ON COLUMN whale_transfers.tx_hash IS 'Transaction hash identifier';
COMMENT ON COLUMN whale_transfers.log_index IS 'Event log index within transaction (0 for native transfers)';
COMMENT ON COLUMN whale_transfers.value IS 'Transfer amount in token units';
COMMENT ON COLUMN whale_transfers.token IS 'Token symbol (ETH for native, USDC/USDT for ERC-20)';

COMMENT ON COLUMN whale_signals.signal_type IS 'Type of behavioral signal detected (accumulation, distribution, etc.)';
COMMENT ON COLUMN whale_signals.confidence IS 'Signal confidence score from 0.0 (low) to 1.0 (high)';
COMMENT ON COLUMN whale_signals.reasons IS 'Array of human-readable reasons for signal generation';
COMMENT ON COLUMN whale_signals.supporting_events IS 'Array of transaction hashes supporting the signal';

-- =====================================================
-- DEPLOYMENT INSTRUCTIONS
-- =====================================================
-- 
-- To deploy this schema to your Supabase database:
-- 
-- 1. Save this file as a migration:
--    supabase/migrations/YYYYMMDD_whale_analytics_production_schema.sql
-- 
-- 2. Push the migration to your database:
--    supabase db push
-- 
-- 3. Verify tables were created:
--    supabase db inspect --linked
-- 
-- 4. Test with sample data insertion:
--    INSERT INTO whale_balances (address, chain, balance, ts, provider, method) 
--    VALUES ('0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', 'ethereum', 1250.5, NOW(), 'alchemy', 'eth_getBalance');
--