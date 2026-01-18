-- URGENT: Fix RLS permissions for user_wallets table
-- Run this immediately in your Supabase SQL editor

-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_wallets';

-- Drop all restrictive policies
DROP POLICY IF EXISTS p_user_wallets_no_insert ON user_wallets;
DROP POLICY IF EXISTS p_user_wallets_no_update ON user_wallets;
DROP POLICY IF EXISTS p_user_wallets_no_delete ON user_wallets;

-- Create permissive policies for authenticated users
CREATE POLICY p_user_wallets_insert_own
  ON user_wallets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY p_user_wallets_update_own
  ON user_wallets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY p_user_wallets_delete_own
  ON user_wallets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT INSERT, UPDATE, DELETE ON user_wallets TO authenticated;
GRANT SELECT ON user_wallets TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_wallets';

-- Test insert permission (replace with your actual user_id)
-- SELECT auth.uid(); -- Run this first to get your user ID
-- Then test: INSERT INTO user_wallets (user_id, address, chain_namespace) VALUES (auth.uid(), '0xtest', 'eip155:1');