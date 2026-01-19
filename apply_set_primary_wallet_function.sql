-- ============================================================================
-- Apply Set Primary Wallet Function
-- ============================================================================
-- Run this in your Supabase SQL Editor to create the function
-- This allows the app to update which wallet is primary

-- Drop function if it exists (to allow re-running this script)
DROP FUNCTION IF EXISTS set_primary_wallet(UUID, TEXT);

-- Create function to set primary wallet
-- This ensures only ONE wallet is primary at a time per user
CREATE OR REPLACE FUNCTION set_primary_wallet(
  p_user_id UUID,
  p_wallet_address TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, set all wallets for this user to NOT primary
  UPDATE user_wallets
  SET is_primary = FALSE,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Then, set the specified wallet to primary
  UPDATE user_wallets
  SET is_primary = TRUE,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND LOWER(address) = LOWER(p_wallet_address);
    
  -- Verify the update worked
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet % not found for user %', p_wallet_address, p_user_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_primary_wallet(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION set_primary_wallet IS 'Sets a wallet as primary for a user. Automatically sets all other wallets to non-primary.';

-- ============================================================================
-- Verify the function was created
-- ============================================================================
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname = 'set_primary_wallet';

-- ============================================================================
-- Test the function (optional)
-- ============================================================================
-- Uncomment the lines below to test with your actual wallet address
-- Replace 'YOUR_WALLET_ADDRESS_HERE' with an actual wallet address from your user_wallets table

-- SELECT set_primary_wallet(
--   auth.uid(),
--   'YOUR_WALLET_ADDRESS_HERE'
-- );

-- Verify only one wallet is primary
-- SELECT address, is_primary, label 
-- FROM user_wallets 
-- WHERE user_id = auth.uid()
-- ORDER BY is_primary DESC, created_at DESC;
