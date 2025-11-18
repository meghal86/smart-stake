-- HarvestPro Rollback Script
-- Migration: 20250201000001_harvestpro_rollback.sql
-- Description: Rollback script to remove HarvestPro schema

-- Drop triggers first
DROP TRIGGER IF EXISTS update_harvest_lots_updated_at ON harvest_lots;
DROP TRIGGER IF EXISTS update_harvest_opportunities_updated_at ON harvest_opportunities;
DROP TRIGGER IF EXISTS update_harvest_sessions_updated_at ON harvest_sessions;
DROP TRIGGER IF EXISTS update_harvest_user_settings_updated_at ON harvest_user_settings;
DROP TRIGGER IF EXISTS update_cex_accounts_updated_at ON cex_accounts;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS cex_trades CASCADE;
DROP TABLE IF EXISTS cex_accounts CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS execution_steps CASCADE;
DROP TABLE IF EXISTS harvest_user_settings CASCADE;
DROP TABLE IF EXISTS harvest_sessions CASCADE;
DROP TABLE IF EXISTS harvest_opportunities CASCADE;
DROP TABLE IF EXISTS harvest_lots CASCADE;

-- Note: We don't drop the update_updated_at_column function as it may be used by other tables
-- Note: We don't drop extensions (uuid-ossp, pg_trgm) as they may be used by other features
