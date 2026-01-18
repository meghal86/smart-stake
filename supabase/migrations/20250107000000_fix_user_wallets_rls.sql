-- =====================================================
-- Fix user_wallets RLS policies to allow authenticated users to manage their own wallets
-- =====================================================

-- Drop the restrictive policies
DROP POLICY IF EXISTS p_user_wallets_no_insert ON user_wallets;
DROP POLICY IF EXISTS p_user_wallets_no_update ON user_wallets;
DROP POLICY IF EXISTS p_user_wallets_no_delete ON user_wallets;

-- Create permissive policies for authenticated users to manage their own wallets
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

-- Ensure SELECT is still allowed (via existing RLS policy)
GRANT SELECT ON user_wallets TO authenticated;