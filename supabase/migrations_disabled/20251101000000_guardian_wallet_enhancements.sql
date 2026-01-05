-- Guardian wallet enhancements: status, wallet types, metadata

ALTER TABLE guardian_wallets
  ADD COLUMN IF NOT EXISTS wallet_type TEXT CHECK (
    wallet_type IN ('browser', 'mobile', 'hardware', 'exchange', 'smart', 'social', 'readonly')
  ),
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (
    status IN ('connected', 'linked', 'readonly')
  ) DEFAULT 'readonly',
  ADD COLUMN IF NOT EXISTS ens_name TEXT,
  ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_scan TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trust_score INT;

-- Ensure defaults are set for future inserts
ALTER TABLE guardian_wallets
  ALTER COLUMN status SET DEFAULT 'readonly',
  ALTER COLUMN added_at SET DEFAULT NOW();

-- Backfill existing rows with sensible defaults
UPDATE guardian_wallets
SET
  wallet_type = COALESCE(wallet_type, 'readonly'),
  status = COALESCE(status, 'readonly'),
  added_at = COALESCE(added_at, created_at)
WHERE wallet_type IS NULL
   OR status IS NULL
   OR added_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_guardian_wallets_status
  ON guardian_wallets(status);
