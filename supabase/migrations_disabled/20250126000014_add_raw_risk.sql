-- Add raw_risk column and update existing data

-- Update existing rows to have valid raw_risk values
UPDATE chain_risk_history SET raw_risk = risk_score WHERE raw_risk IS NULL;

-- Insert historical data with all required columns including raw_risk
INSERT INTO chain_risk_history (chain, day, snapshot_date, risk_score, raw_risk, concentration_risk, flow_risk, activity_risk)
VALUES 
('ETH', CURRENT_DATE - 7, CURRENT_DATE - 7, 38, 38, 18, 12, 8),
('ETH', CURRENT_DATE - 6, CURRENT_DATE - 6, 42, 42, 20, 14, 8),
('ETH', CURRENT_DATE - 5, CURRENT_DATE - 5, 39, 39, 17, 13, 9),
('ETH', CURRENT_DATE - 4, CURRENT_DATE - 4, 45, 45, 22, 15, 8),
('ETH', CURRENT_DATE - 3, CURRENT_DATE - 3, 48, 48, 24, 16, 8),
('ETH', CURRENT_DATE - 2, CURRENT_DATE - 2, 44, 44, 21, 15, 8),
('ETH', CURRENT_DATE - 1, CURRENT_DATE - 1, 45, 45, 20, 15, 10),
('BTC', CURRENT_DATE - 7, CURRENT_DATE - 7, 18, 18, 8, 6, 4),
('BTC', CURRENT_DATE - 6, CURRENT_DATE - 6, 22, 22, 10, 7, 5),
('BTC', CURRENT_DATE - 5, CURRENT_DATE - 5, 19, 19, 8, 6, 5),
('BTC', CURRENT_DATE - 4, CURRENT_DATE - 4, 24, 24, 11, 8, 5),
('BTC', CURRENT_DATE - 3, CURRENT_DATE - 3, 26, 26, 12, 9, 5),
('BTC', CURRENT_DATE - 2, CURRENT_DATE - 2, 21, 21, 9, 7, 5),
('BTC', CURRENT_DATE - 1, CURRENT_DATE - 1, 22, 22, 9, 7, 6)
ON CONFLICT DO NOTHING;