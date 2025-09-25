-- Fix null constraint by providing all required columns

-- First, let's see what columns exist and add missing ones
DO $$
BEGIN
    -- Add day column if it doesn't exist (seems to be required)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chain_risk_history' AND column_name = 'day') THEN
        ALTER TABLE chain_risk_history ADD COLUMN day INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Update existing rows to have valid day values
UPDATE chain_risk_history SET day = 1 WHERE day IS NULL;

-- Insert historical data with all required columns
INSERT INTO chain_risk_history (chain, day, snapshot_date, risk_score, concentration_risk, flow_risk, activity_risk)
VALUES 
('ETH', 1, CURRENT_DATE - 7, 38, 18, 12, 8),
('ETH', 2, CURRENT_DATE - 6, 42, 20, 14, 8),
('ETH', 3, CURRENT_DATE - 5, 39, 17, 13, 9),
('ETH', 4, CURRENT_DATE - 4, 45, 22, 15, 8),
('ETH', 5, CURRENT_DATE - 3, 48, 24, 16, 8),
('ETH', 6, CURRENT_DATE - 2, 44, 21, 15, 8),
('ETH', 7, CURRENT_DATE - 1, 45, 20, 15, 10),
('BTC', 1, CURRENT_DATE - 7, 18, 8, 6, 4),
('BTC', 2, CURRENT_DATE - 6, 22, 10, 7, 5),
('BTC', 3, CURRENT_DATE - 5, 19, 8, 6, 5),
('BTC', 4, CURRENT_DATE - 4, 24, 11, 8, 5),
('BTC', 5, CURRENT_DATE - 3, 26, 12, 9, 5),
('BTC', 6, CURRENT_DATE - 2, 21, 9, 7, 5),
('BTC', 7, CURRENT_DATE - 1, 22, 9, 7, 6)
ON CONFLICT DO NOTHING;