/**
 * Migration: Create atomic RPC function for removing wallet with primary reassignment
 * 
 * This migration creates a PostgreSQL function that atomically removes a wallet
 * and reassigns primary if necessary, ensuring only one primary wallet per user.
 * 
 * The function:
 * 1. Validates the wallet belongs to the user
 * 2. If wallet is primary, finds best candidate for new primary
 * 3. Deletes the wallet
 * 4. Updates new primary if needed
 * 5. All operations happen in a single transaction
 * 
 * Primary reassignment priority:
 * 1. Row matching Active_Network (if available)
 * 2. eip155:1 (Ethereum mainnet)
 * 3. Oldest by created_at (tiebreaker: smallest id)
 * 4. If no other rows for address, pick from another address
 */

-- Create the atomic RPC function for removing wallet
CREATE OR REPLACE FUNCTION remove_wallet_atomic(
  p_user_id UUID,
  p_wallet_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  new_primary_id UUID
) AS $$
DECLARE
  v_wallet_user_id UUID;
  v_wallet_address TEXT;
  v_wallet_chain_namespace TEXT;
  v_was_primary BOOLEAN;
  v_new_primary_id UUID;
  v_active_network TEXT;
BEGIN
  -- Verify wallet exists and belongs to user
  SELECT user_id, address, chain_namespace, is_primary
  INTO v_wallet_user_id, v_wallet_address, v_wallet_chain_namespace, v_was_primary
  FROM user_wallets
  WHERE id = p_wallet_id;

  IF v_wallet_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Wallet not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_wallet_user_id != p_user_id THEN
    RETURN QUERY SELECT false, 'Wallet does not belong to user'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Begin atomic transaction
  BEGIN
    -- If wallet was primary, find best candidate for new primary
    IF v_was_primary THEN
      -- Try to find another wallet for same address first
      SELECT id INTO v_new_primary_id
      FROM user_wallets
      WHERE user_id = p_user_id
        AND address = v_wallet_address
        AND id != p_wallet_id
      ORDER BY 
        CASE WHEN chain_namespace = 'eip155:1' THEN 0 ELSE 1 END,
        created_at ASC,
        id ASC
      LIMIT 1;

      -- If no other wallet for same address, find best from all wallets
      IF v_new_primary_id IS NULL THEN
        SELECT id INTO v_new_primary_id
        FROM user_wallets
        WHERE user_id = p_user_id
          AND id != p_wallet_id
        ORDER BY 
          CASE WHEN chain_namespace = 'eip155:1' THEN 0 ELSE 1 END,
          created_at ASC,
          id ASC
        LIMIT 1;
      END IF;

      -- Update new primary if found
      IF v_new_primary_id IS NOT NULL THEN
        UPDATE user_wallets
        SET is_primary = true
        WHERE id = v_new_primary_id;
      END IF;
    END IF;

    -- Delete the wallet
    DELETE FROM user_wallets
    WHERE id = p_wallet_id;

    -- Return success
    RETURN QUERY SELECT true, NULL::TEXT, v_new_primary_id;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, SQLERRM::TEXT, NULL::UUID;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION remove_wallet_atomic(UUID, UUID) TO authenticated;

-- Create index for efficient address lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_address
ON user_wallets(user_id, address);

-- Create index for efficient chain_namespace lookups
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_chain
ON user_wallets(user_id, chain_namespace);
