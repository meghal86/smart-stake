-- Add all missing columns to chain_risk_history table

DO $$
BEGIN
    -- Add risk_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chain_risk_history' AND column_name = 'risk_score') THEN
        ALTER TABLE chain_risk_history ADD COLUMN risk_score INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add snapshot_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chain_risk_history' AND column_name = 'snapshot_date') THEN
        ALTER TABLE chain_risk_history ADD COLUMN snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add concentration_risk column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chain_risk_history' AND column_name = 'concentration_risk') THEN
        ALTER TABLE chain_risk_history ADD COLUMN concentration_risk INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add flow_risk column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chain_risk_history' AND column_name = 'flow_risk') THEN
        ALTER TABLE chain_risk_history ADD COLUMN flow_risk INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add activity_risk column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chain_risk_history' AND column_name = 'activity_risk') THEN
        ALTER TABLE chain_risk_history ADD COLUMN activity_risk INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Insert historical data for sparklines
INSERT INTO chain_risk_history (chain, snapshot_date, risk_score, concentration_risk, flow_risk, activity_risk)
VALUES 
('ETH', CURRENT_DATE - 7, 38, 18, 12, 8),
('ETH', CURRENT_DATE - 6, 42, 20, 14, 8),
('ETH', CURRENT_DATE - 5, 39, 17, 13, 9),
('ETH', CURRENT_DATE - 4, 45, 22, 15, 8),
('ETH', CURRENT_DATE - 3, 48, 24, 16, 8),
('ETH', CURRENT_DATE - 2, 44, 21, 15, 8),
('ETH', CURRENT_DATE - 1, 45, 20, 15, 10),
('BTC', CURRENT_DATE - 7, 18, 8, 6, 4),
('BTC', CURRENT_DATE - 6, 22, 10, 7, 5),
('BTC', CURRENT_DATE - 5, 19, 8, 6, 5),
('BTC', CURRENT_DATE - 4, 24, 11, 8, 5),
('BTC', CURRENT_DATE - 3, 26, 12, 9, 5),
('BTC', CURRENT_DATE - 2, 21, 9, 7, 5),
('BTC', CURRENT_DATE - 1, 22, 9, 7, 6)
ON CONFLICT DO NOTHING;