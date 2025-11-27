-- Check what data exists in HarvestPro tables
-- Run this to diagnose the connection error

-- Check if we have any users
SELECT 'Users' as table_name, COUNT(*) as count FROM auth.users;

-- Check harvest_transactions (Edge Function needs this)
SELECT 'harvest_transactions' as table_name, COUNT(*) as count FROM harvest_transactions;

-- Check harvest_lots (we seeded this)
SELECT 'harvest_lots' as table_name, COUNT(*) as count FROM harvest_lots;

-- Check harvest_opportunities (we seeded this)
SELECT 'harvest_opportunities' as table_name, COUNT(*) as count FROM harvest_opportunities;

-- Show sample data from each table
SELECT 'Sample harvest_lots:' as info;
SELECT token, quantity, cost_basis, current_price, unrealized_pnl 
FROM harvest_lots 
LIMIT 3;

SELECT 'Sample harvest_opportunities:' as info;
SELECT token, unrealized_loss, net_tax_benefit, risk_level, recommendation_badge
FROM harvest_opportunities 
LIMIT 3;

-- Check if we have a test user
SELECT 'Test user check:' as info;
SELECT id, email FROM auth.users LIMIT 1;
