-- Verify airdrop seeding
SELECT 
  COUNT(*) as total_airdrops,
  COUNT(DISTINCT source) as sources,
  COUNT(CASE WHEN source = 'admin' THEN 1 END) as admin_airdrops
FROM opportunities
WHERE type = 'airdrop';

-- Show sample airdrops
SELECT 
  title,
  protocol_name,
  source,
  snapshot_date,
  claim_start,
  claim_end,
  airdrop_category,
  trust_score
FROM opportunities
WHERE type = 'airdrop' AND source = 'admin'
ORDER BY created_at DESC
LIMIT 5;
