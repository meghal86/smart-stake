-- Check what tables and columns actually exist in your database

-- 1. Check if harvest_lots table exists
SELECT 
  'harvest_lots table exists' as status,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'harvest_lots';

-- 2. List all columns in harvest_lots (if it exists)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'harvest_lots'
ORDER BY ordinal_position;

-- 3. Check if harvest_opportunities table exists
SELECT 
  'harvest_opportunities table exists' as status,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'harvest_opportunities';

-- 4. List all columns in harvest_opportunities (if it exists)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'harvest_opportunities'
ORDER BY ordinal_position;

-- 5. Check if you have any users
SELECT 
  'User check' as status,
  COUNT(*) as user_count,
  (SELECT id FROM auth.users LIMIT 1) as first_user_id
FROM auth.users;
