-- Check whale_transfers table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'whale_transfers' 
AND table_schema = 'public'
ORDER BY ordinal_position;