-- Check existing columns and add missing ones
DO $$ 
BEGIN
    -- Add ingested_at column to whale_balances if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whale_balances' AND column_name = 'ingested_at'
    ) THEN
        ALTER TABLE whale_balances ADD COLUMN ingested_at TIMESTAMP DEFAULT NOW();
    END IF;
    
    -- Add ingested_at column to whale_transfers if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whale_transfers' AND column_name = 'ingested_at'
    ) THEN
        ALTER TABLE whale_transfers ADD COLUMN ingested_at TIMESTAMP DEFAULT NOW();
    END IF;
    
    -- Add ingested_at column to whale_signals if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whale_signals' AND column_name = 'ingested_at'
    ) THEN
        ALTER TABLE whale_signals ADD COLUMN ingested_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_whale_balances_ingested_at ON whale_balances(ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_ingested_at ON whale_transfers(ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_whale_signals_ingested_at ON whale_signals(ingested_at DESC);