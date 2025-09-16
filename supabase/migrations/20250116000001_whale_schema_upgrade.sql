-- Whale Analytics Schema Upgrade: Split whale_data_cache into specialized tables
-- Migration: 20250116000001_whale_schema_upgrade.sql

-- 1. Create whale_balances table
CREATE TABLE whale_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    token_address TEXT,
    balance DECIMAL(36,18) NOT NULL,
    balance_usd DECIMAL(18,2),
    ts TIMESTAMP NOT NULL,
    
    -- Provenance fields
    provider TEXT NOT NULL,
    method TEXT NOT NULL,
    ingested_at TIMESTAMP DEFAULT NOW(),
    request_id TEXT,
    latency_ms INTEGER,
    
    -- Idempotency for EVM chains
    block_number BIGINT,
    idempotency_key TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN chain IN ('ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism') 
            THEN address || ':' || chain || ':' || COALESCE(block_number::text, '')
            ELSE address || ':' || chain || ':' || extract(epoch from ts)::text
        END
    ) STORED,
    
    UNIQUE(idempotency_key)
);

-- 2. Create whale_transfers table  
CREATE TABLE whale_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    value DECIMAL(36,18) NOT NULL,
    value_usd DECIMAL(18,2),
    token_address TEXT,
    token_symbol TEXT,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    ts TIMESTAMP NOT NULL,
    
    -- Provenance fields
    provider TEXT NOT NULL,
    method TEXT NOT NULL,
    ingested_at TIMESTAMP DEFAULT NOW(),
    request_id TEXT,
    latency_ms INTEGER,
    
    -- EVM specific fields
    block_number BIGINT,
    log_index INTEGER,
    gas_used BIGINT,
    gas_price DECIMAL(36,18),
    
    -- Idempotency for EVM chains
    idempotency_key TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN chain IN ('ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism')
            THEN tx_hash || ':' || COALESCE(log_index::text, '0')
            ELSE tx_hash || ':' || extract(epoch from ts)::text
        END
    ) STORED,
    
    UNIQUE(idempotency_key)
);

-- 3. Create whale_signals table (enhanced)
DROP TABLE IF EXISTS whale_signals CASCADE;
CREATE TABLE whale_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    signal_type TEXT NOT NULL,
    value DECIMAL(36,18),
    confidence FLOAT NOT NULL DEFAULT 0.5,
    reasons TEXT[] DEFAULT '{}',
    supporting_events TEXT[] DEFAULT '{}',
    ts TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Provenance fields
    provider TEXT NOT NULL DEFAULT 'whale-analytics',
    method TEXT NOT NULL DEFAULT 'risk_computation',
    ingested_at TIMESTAMP DEFAULT NOW(),
    request_id TEXT,
    latency_ms INTEGER,
    
    -- Signal metadata
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    alert_triggered BOOLEAN DEFAULT false,
    
    -- Idempotency
    idempotency_key TEXT GENERATED ALWAYS AS (
        address || ':' || chain || ':' || signal_type || ':' || extract(epoch from ts)::text
    ) STORED,
    
    UNIQUE(idempotency_key)
);

-- 4. Performance indexes
-- Whale balances indexes
CREATE INDEX idx_whale_balances_addr_chain_ts ON whale_balances(address, chain, ts DESC);
CREATE INDEX idx_whale_balances_provider_ingested ON whale_balances(provider, ingested_at DESC);
CREATE INDEX idx_whale_balances_balance_usd ON whale_balances(balance_usd DESC) WHERE balance_usd > 1000000;

-- Whale transfers indexes  
CREATE INDEX idx_whale_transfers_from_chain_ts ON whale_transfers(from_address, chain, ts DESC);
CREATE INDEX idx_whale_transfers_to_chain_ts ON whale_transfers(to_address, chain, ts DESC);
CREATE INDEX idx_whale_transfers_value_usd ON whale_transfers(value_usd DESC) WHERE value_usd > 100000;
CREATE INDEX idx_whale_transfers_tx_hash ON whale_transfers(tx_hash);
CREATE INDEX idx_whale_transfers_provider_ingested ON whale_transfers(provider, ingested_at DESC);

-- Whale signals indexes
CREATE INDEX idx_whale_signals_addr_chain_ts ON whale_signals(address, chain, ts DESC);
CREATE INDEX idx_whale_signals_confidence_risk ON whale_signals(confidence DESC, risk_score DESC);
CREATE INDEX idx_whale_signals_type_ts ON whale_signals(signal_type, ts DESC);
CREATE INDEX idx_whale_signals_provider_ingested ON whale_signals(provider, ingested_at DESC);

-- 5. Row Level Security policies
ALTER TABLE whale_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_signals ENABLE ROW LEVEL SECURITY;

-- Service role policies (full access)
CREATE POLICY "Service role full access balances" ON whale_balances FOR ALL USING (true);
CREATE POLICY "Service role full access transfers" ON whale_transfers FOR ALL USING (true);  
CREATE POLICY "Service role full access signals" ON whale_signals FOR ALL USING (true);

-- Authenticated user policies (read access)
CREATE POLICY "Authenticated read balances" ON whale_balances FOR SELECT USING (true);
CREATE POLICY "Authenticated read transfers" ON whale_transfers FOR SELECT USING (true);
CREATE POLICY "Authenticated read signals" ON whale_signals FOR SELECT USING (true);

-- 6. Data migration from whale_data_cache (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'whale_data_cache') THEN
        -- Migrate balance data
        INSERT INTO whale_balances (address, chain, balance, ts, provider, method)
        SELECT address, chain, balance, ts, 'migration', 'cache_import'
        FROM whale_data_cache 
        WHERE balance IS NOT NULL
        ON CONFLICT (idempotency_key) DO NOTHING;
        
        -- Migrate transfer data  
        INSERT INTO whale_transfers (tx_hash, from_address, to_address, value, chain, ts, provider, method)
        SELECT 
            COALESCE(tx_hash, gen_random_uuid()::text),
            address,
            'unknown',
            balance,
            chain,
            ts,
            'migration',
            'cache_import'
        FROM whale_data_cache
        WHERE balance IS NOT NULL
        ON CONFLICT (idempotency_key) DO NOTHING;
        
        RAISE NOTICE 'Migration completed from whale_data_cache';
    END IF;
END $$;

-- 7. Create optimized views for common queries
CREATE VIEW whale_activity_summary AS
SELECT 
    w.address,
    w.chain,
    COUNT(DISTINCT t.tx_hash) as tx_count_24h,
    SUM(t.value_usd) as volume_24h,
    MAX(b.balance_usd) as current_balance_usd,
    MAX(s.risk_score) as risk_score,
    MAX(s.confidence) as confidence
FROM whale_balances b
LEFT JOIN whale_transfers t ON (t.from_address = b.address OR t.to_address = b.address) 
    AND t.chain = b.chain 
    AND t.ts > NOW() - INTERVAL '24 hours'
LEFT JOIN whale_signals s ON s.address = b.address 
    AND s.chain = b.chain 
    AND s.ts > NOW() - INTERVAL '24 hours'
WHERE b.ts > NOW() - INTERVAL '24 hours'
GROUP BY w.address, w.chain;

-- 8. Functions for data integrity
CREATE OR REPLACE FUNCTION update_whale_signals_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ts = NOW();
    NEW.ingested_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whale_signals_update_timestamp
    BEFORE UPDATE ON whale_signals
    FOR EACH ROW
    EXECUTE FUNCTION update_whale_signals_timestamp();

-- 9. Cleanup old table (commented for safety)
-- DROP TABLE IF EXISTS whale_data_cache;

COMMIT;