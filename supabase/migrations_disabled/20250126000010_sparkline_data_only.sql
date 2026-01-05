-- Add sparkline data only

-- Insert sample historical data for sparklines
INSERT INTO chain_risk_history (chain, snapshot_date, risk_score)
VALUES 
('ETH', CURRENT_DATE - 7, 38),
('ETH', CURRENT_DATE - 6, 42),
('ETH', CURRENT_DATE - 5, 39),
('ETH', CURRENT_DATE - 4, 45),
('ETH', CURRENT_DATE - 3, 48),
('ETH', CURRENT_DATE - 2, 44),
('ETH', CURRENT_DATE - 1, 45),
('BTC', CURRENT_DATE - 7, 18),
('BTC', CURRENT_DATE - 6, 22),
('BTC', CURRENT_DATE - 5, 19),
('BTC', CURRENT_DATE - 4, 24),
('BTC', CURRENT_DATE - 3, 26),
('BTC', CURRENT_DATE - 2, 21),
('BTC', CURRENT_DATE - 1, 22)
ON CONFLICT (chain, snapshot_date) DO NOTHING;