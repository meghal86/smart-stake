/**
 * Migration: Create atomic RPC function for setting primary wallet
 * 
 * This migration creates a PostgreSQL function that atomically sets a wallet
 * as primary for a user, ensuring only one primary wallet per user.
 * 
 * The function:
 * 1. Validates the wallet belongs to the user
 * 2. Sets all other wallets for the user to is_primary = false
 * 3. Sets the specified wallet to is_primary = true
 * 4. All operations happen in a single transaction
 */

-- Create the atomic RPC function for setting primary wallet
CREATE OR REPLACE FUNCTION set_primary_wallet_atomic(
  p_user_id UUID,
  p_wallet_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_wallet_user_id UUID;
BEGIN
  -- Verify wallet exists and belongs to user
  SELECT user_id INTO v_wallet_user_id
  FROM user_wallets
  WHERE id = p_wallet_id;

  IF v_wallet_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Wallet not found'::TEXT;
    RETURN;
  END IF;

  IF v_wallet_user_id != p_user_id THEN
    RETURN QUERY SELECT false, 'Wallet does not belong to user'::TEXT;
    RETURN;
  END IF;

  -- Begin atomic transaction
  BEGIN
    -- Set all wallets for this user to is_primary = false
    UPDATE user_wallets
    SET is_primary = false
    WHERE user_id = p_user_id;

    -- Set the specified wallet to is_primary = true
    UPDATE user_wallets
    SET is_primary = true
    WHERE id = p_wallet_id;

    -- Return success
    RETURN QUERY SELECT true, NULL::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_primary_wallet_atomic(UUID, UUID) TO authenticated;

-- Create index for efficient primary wallet lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_primary
ON user_wallets(user_id, is_primary)
WHERE is_primary = true;

-- Create index for efficient user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id
ON user_wallets(user_id);
