-- Remove Duplicate Wallets and Add Unique Constraint
-- This script will:
-- 1. Remove duplicate wallet entries (keeping the oldest one)
-- 2. Add a unique constraint to prevent future duplicates

-- Step 1: Find and display duplicates (for verification)
SELECT 
  address,
  user_id,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as wallet_ids,
  MIN(created_at) as first_added,
  MAX(created_at) as last_added
FROM user_wallets
GROUP BY address, user_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Delete duplicate entries (keep the oldest one for each user+address combination)
DELETE FROM user_wallets
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, LOWER(address) 
        ORDER BY created_at ASC
      ) as row_num
    FROM user_wallets
  ) ranked
  WHERE row_num > 1
);

-- Step 3: Add unique constraint to prevent future duplicates
-- First, drop the constraint if it exists
ALTER TABLE user_wallets 
DROP CONSTRAINT IF EXISTS unique_user_wallet;

-- Add the unique constraint on user_id + lowercase address
ALTER TABLE user_wallets 
ADD CONSTRAINT unique_user_wallet 
UNIQUE (user_id, (LOWER(address)));

-- Step 4: Verify no duplicates remain
SELECT 
  address,
  user_id,
  COUNT(*) as count
FROM user_wallets
GROUP BY address, user_id
HAVING COUNT(*) > 1;

-- If the above query returns no rows, duplicates have been successfully removed!
