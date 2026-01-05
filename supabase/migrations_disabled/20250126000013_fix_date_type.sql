-- Fix date type constraint

-- Update existing rows to have valid day values (using DATE type)
UPDATE chain_risk_history SET day = CURRENT_DATE WHERE day IS NULL;

-- Insert historical data with proper date values
INSERT INTO chain_risk_history (chain, day, snapshot_date, risk_score, concentration_risk, flow_risk, activity_risk)
VALUES 
('ETH', CURRENT_DATE - 7, CURRENT_DATE - 7, 38, 18, 12, 8),
('ETH', CURRENT_DATE - 6, CURRENT_DATE - 6, 42, 20, 14, 8),
('ETH', CURRENT_DATE - 5, CURRENT_DATE - 5, 39, 17, 13, 9),
('ETH', CURRENT_DATE - 4, CURRENT_DATE - 4, 45, 22, 15, 8),
('ETH', CURRENT_DATE - 3, CURRENT_DATE - 3, 48, 24, 16, 8),
('ETH', CURRENT_DATE - 2, CURRENT_DATE - 2, 44, 21, 15, 8),
('ETH', CURRENT_DATE - 1, CURRENT_DATE - 1, 45, 20, 15, 10),
('BTC', CURRENT_DATE - 7, CURRENT_DATE - 7, 18, 8, 6, 4),
('BTC', CURRENT_DATE - 6, CURRENT_DATE - 6, 22, 10, 7, 5),
('BTC', CURRENT_DATE - 5, CURRENT_DATE - 5, 19, 8, 6, 5),
('BTC', CURRENT_DATE - 4, CURRENT_DATE - 4, 24, 11, 8, 5),
('BTC', CURRENT_DATE - 3, CURRENT_DATE - 3, 26, 12, 9, 5),
('BTC', CURRENT_DATE - 2, CURRENT_DATE - 2, 21, 9, 7, 5),
('BTC', CURRENT_DATE - 1, CURRENT_DATE - 1, 22, 9, 7, 6)
ON CONFLICT DO NOTHING;