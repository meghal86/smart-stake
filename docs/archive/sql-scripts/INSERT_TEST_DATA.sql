-- Insert test whale digest data
INSERT INTO whale_digest (event_time, asset, summary, severity, source, amount_usd)
VALUES 
  (NOW(), 'BTC', 'Large whale moved 500 BTC to cold storage', 5, 'whale_alert', 25000000),
  (NOW() - INTERVAL '1 hour', 'ETH', 'Exchange outflow detected: 2000 ETH', 4, 'whale_alert', 8000000),
  (NOW() - INTERVAL '2 hours', 'USDT', 'Whale transferred 10M USDT', 3, 'whale_alert', 10000000),
  (NOW() - INTERVAL '3 hours', 'BTC', 'Dormant whale awakens after 2 years', 5, 'whale_alert', 15000000),
  (NOW() - INTERVAL '4 hours', 'ETH', 'DeFi whale exits position', 4, 'whale_alert', 6000000);