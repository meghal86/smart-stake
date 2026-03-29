-- Execute this in Supabase SQL Editor to populate whale data
-- Step 1: Create tables (if not already done)
-- Step 2: Insert sample data

-- Insert whale balances
INSERT INTO whale_balances (address, chain, balance, balance_usd, ts, provider, method, block_number) VALUES
('0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', 'ethereum', 15420.50, 52847340.00, NOW(), 'alchemy', 'balance_check', 19234567),
('0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', 'ethereum', 8750.25, 29912855.00, NOW(), 'moralis', 'balance_check', 19234566),
('0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', 'ethereum', 12300.75, 42067570.00, NOW(), 'alchemy', 'balance_check', 19234568),
('0x742d35Cc6634C0532925a3b8D4C9db96C4b4df93', 'ethereum', 6890.00, 23547100.00, NOW(), 'infura', 'balance_check', 19234567),
('0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489', 'ethereum', 21500.80, 73522736.00, NOW(), 'alchemy', 'balance_check', 19234569)
ON CONFLICT (idempotency_key) DO NOTHING;

-- Insert whale transfers
INSERT INTO whale_transfers (tx_hash, from_address, to_address, value, value_usd, chain, ts, provider, method, block_number, log_index) VALUES
('0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', 500.00, 1710000.00, 'ethereum', NOW(), 'alchemy', 'transfer_monitor', 19234566, 45),
('0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567', '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4df93', 1200.50, 4106505.00, 'ethereum', NOW(), 'moralis', 'transfer_monitor', 19234567, 78)
ON CONFLICT (idempotency_key) DO NOTHING;

-- Insert whale signals
INSERT INTO whale_signals (address, chain, signal_type, value, confidence, reasons, supporting_events, risk_score, provider, method) VALUES
('0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', 'ethereum', 'risk_score', '75', 0.85, ARRAY['High transfer velocity: 12 tx/week', 'Frequent CEX interactions: 65.2%'], ARRAY['0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'], 75, 'whale-analytics', 'risk_computation'),
('0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', 'ethereum', 'risk_score', '45', 0.72, ARRAY['Medium balance concentration: 78.3%'], ARRAY['0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'], 45, 'whale-analytics', 'risk_computation'),
('0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', 'ethereum', 'risk_score', '62', 0.78, ARRAY['High balance concentration: 82.1%', 'Anomalous behavior detected (z-score: 2.34)'], ARRAY['0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567'], 62, 'whale-analytics', 'risk_computation'),
('0x742d35Cc6634C0532925a3b8D4C9db96C4b4df93', 'ethereum', 'risk_score', '28', 0.65, ARRAY['Normal whale behavior patterns detected'], ARRAY[], 28, 'whale-analytics', 'risk_computation'),
('0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489', 'ethereum', 'risk_score', '88', 0.92, ARRAY['High transfer velocity: 18 tx/week', 'High balance concentration: 89.7%', 'Frequent CEX interactions: 71.4%'], ARRAY[], 88, 'whale-analytics', 'risk_computation')
ON CONFLICT (idempotency_key) DO NOTHING;