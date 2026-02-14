-- ============================================================================
-- Privacy Model: Logging Rules Documentation
-- Migration: 20260214000000_privacy_logging_rules.sql
-- 
-- This migration documents the logging privacy rules for the Unified Portfolio System.
-- It does not modify any tables, but serves as a canonical reference for logging standards.
--
-- Requirements: R12.6 - Logs MUST NOT include raw addresses unless explicit debug flag enabled
-- ============================================================================

-- ============================================================================
-- LOGGING PRIVACY RULES
-- ============================================================================

-- Rule 1: Raw wallet addresses MUST NOT appear in application logs in production
-- Rule 2: Address hashes (SHA-256, 16-char prefix) MUST be used for correlation
-- Rule 3: DEBUG_RAW_ADDRESSES=true flag MAY be used in development ONLY
-- Rule 4: All address-like fields MUST be automatically redacted by the logger
-- Rule 5: Transaction hashes MUST be truncated to first 10 characters
-- Rule 6: Audit logs MUST use address hashes for security event correlation

-- ============================================================================
-- IMPLEMENTATION REFERENCE
-- ============================================================================

-- The logging privacy rules are implemented in:
--   - src/lib/portfolio/logger.ts: PortfolioLogger class with automatic redaction
--   - .kiro/specs/unified-portfolio/PRIVACY_MODEL.md: Complete documentation

-- ============================================================================
-- ADDRESS HASH GENERATION
-- ============================================================================

-- Address hashes are generated using SHA-256 and stored in user_wallets.address_hash
-- This allows efficient lookups without exposing raw addresses in logs or indexes

-- Example address hash generation (already implemented in user_wallets trigger):
-- NEW.address_hash = encode(sha256(lower(NEW.address)::bytea), 'hex');

-- ============================================================================
-- LOGGING EXAMPLES
-- ============================================================================

-- ✅ CORRECT: Log with address hash
-- portfolioLogger.info('Snapshot created', {
--   userId: 'uuid',
--   walletAddressHash: 'a1b2c3d4e5f6g7h8',
--   netWorth: 50000
-- });

-- ❌ INCORRECT: Log with raw address (FORBIDDEN in production)
-- console.log('Snapshot created for wallet:', '0x1234567890abcdef');

-- ============================================================================
-- DEBUG MODE WARNING
-- ============================================================================

-- DEBUG_RAW_ADDRESSES=true MUST NEVER be enabled in production environments
-- When enabled, logs include a warning: "RAW ADDRESS LOGGING ENABLED - DO NOT USE IN PRODUCTION"

-- ============================================================================
-- COMPLIANCE MONITORING
-- ============================================================================

-- To verify compliance, monitor logs for:
--   1. Absence of raw addresses (0x[a-fA-F0-9]{40} pattern)
--   2. Presence of address hashes (16-character hex strings)
--   3. Absence of DEBUG_RAW_ADDRESSES warnings in production

-- ============================================================================
-- AUDIT TRAIL
-- ============================================================================

-- All security-critical operations MUST be logged with audit flag:
--   - Wallet linking/unlinking
--   - Plan creation and execution
--   - Policy violations
--   - Simulation failures
--   - Payload mismatches

-- Audit logs use address hashes for correlation while maintaining privacy

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_wallets IS 'User wallet registry with privacy-preserving address_hash for logging and indexing. Raw addresses used only for RPC queries, never logged in production.';

COMMENT ON COLUMN user_wallets.address IS 'Normalized (lowercase) wallet address. Used for RPC queries only. MUST NOT appear in logs unless DEBUG_RAW_ADDRESSES=true.';

COMMENT ON COLUMN user_wallets.address_hash IS 'SHA-256 hash of normalized address (first 16 chars). Used for logging, indexing, and correlation without exposing raw address.';

COMMENT ON COLUMN user_wallets.address_enc IS 'Optional encrypted address for additional security layer. Not currently used but available for future encryption requirements.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- This migration is documentation-only and makes no schema changes.
-- It serves as a canonical reference for logging privacy rules.
