# HarvestPro Database Schema Consolidation

## Overview

This document describes the complete, consolidated database schema for HarvestPro that includes ALL tables needed across v1 (Core), v2 (Institutional), and v3 (Enterprise) phases.

## File Location

**Primary Migration File:**
```
supabase/migrations/20250201000000_harvestpro_complete_schema.sql
```

This single file replaces the need for multiple migration files and contains everything needed for all phases.

## Tables Summary

### V1 Core Tables (9 tables)

1. **harvest_lots** - Individual acquisition lots for FIFO cost basis
   - Enhanced with v2 fields: `chain_id`, `venue_type`, `venue_name`, `mev_risk_score`

2. **harvest_opportunities** - Eligible harvest opportunities with net benefits
   - Enhanced with v2 fields: `tax_rate_used`, `mev_risk_cost_usd`, `economic_substance_flag`, `proxy_asset_symbol`

3. **harvest_sessions** - User harvest execution sessions
   - Enhanced with v2 fields: `execution_strategy`, `mev_protection_mode`, `economic_substance_status`, `jurisdiction_code`
   - Enhanced with v3 fields: `awaiting_approval` status, `custody_transaction_id`

4. **execution_steps** - Individual steps within harvest sessions
   - Enhanced with v2 fields: `private_rpc_used`, `mev_protection_provider`, `gas_paid_usd`, `slippage_realized_bps`

5. **harvest_user_settings** - User-specific settings
   - Enhanced with v2 fields: `max_daily_loss_usd`, `max_single_trade_notional_usd`, `max_slippage_bps`, `require_private_rpc`, `allow_cex_auto_trade`
   - Enhanced with v3 fields: `custody_provider`, `custody_api_credentials`, `custody_vault_id`, `approval_threshold_usd`, `approver_role`, `sanctions_screening_enabled`, `order_routing_strategy`, `twap_duration_minutes`, `limit_price_floor`

6. **wallet_transactions** - Transaction history for FIFO calculation

7. **cex_accounts** - Linked CEX accounts with encrypted credentials

8. **cex_trades** - Trade history from CEX accounts

9. **harvest_sync_status** - Sync status tracking for wallets and CEX

### V3 Enterprise Tables (2 tables)

10. **approval_requests** - Maker/checker governance workflow
    - Fields: `request_id`, `session_id`, `requester_id`, `approver_id`, `requested_at`, `approved_at`, `status`, `digital_signature`, `rejection_reason`, `metadata`

11. **sanctions_screening_logs** - KYT/AML audit trail
    - Fields: `log_id`, `session_id`, `address_checked`, `risk_score`, `screening_provider`, `result`, `flagged_reasons`, `checked_at`

## Total: 11 Tables

## Indexes Summary

The schema includes **30+ performance indexes** covering:

- User-scoped queries (all tables)
- Time-based sorting (created_at, timestamp)
- Status filtering (harvest_sessions, execution_steps, approval_requests)
- Full-text search (token names)
- Foreign key relationships
- Conditional indexes for active records
- Compliance audit queries

## Key Features

### Row Level Security (RLS)
- All 11 tables have RLS enabled
- User-scoped policies ensure data isolation
- Approval requests accessible by both requester and approver
- Sanctions logs accessible through session ownership

### Automated Triggers
- `updated_at` timestamp auto-update on 6 tables:
  - harvest_lots
  - harvest_opportunities
  - harvest_sessions
  - harvest_user_settings
  - cex_accounts
  - harvest_sync_status

### Data Integrity
- Foreign key constraints with CASCADE deletes
- CHECK constraints for valid enums and ranges
- UNIQUE constraints for preventing duplicates
- NOT NULL constraints for required fields

## Phase Compatibility

### V1 (Core) - Ready Now
All v1 tables and fields are present. The schema is fully backward compatible.

### V2 (Institutional) - Ready Now
All v2 enhancements are included as optional fields in existing tables:
- MEV protection tracking
- Economic substance validation
- Institutional guardrails
- Multi-chain support
- Proxy asset selection

### V3 (Enterprise) - Ready Now
All v3 features are included:
- Approval workflow tables
- Sanctions screening tables
- Custody integration fields
- TWAP/VWAP configuration
- Maker/checker governance

## Migration Strategy

### For New Installations
Simply run the complete schema migration:
```bash
supabase db push
```

### For Existing v1 Installations
The schema is designed to be additive. Existing v1 tables will have new columns added, and new v3 tables will be created. No data loss will occur.

### Rollback Strategy
If needed, you can drop all HarvestPro tables:
```sql
DROP TABLE IF EXISTS sanctions_screening_logs CASCADE;
DROP TABLE IF EXISTS approval_requests CASCADE;
DROP TABLE IF EXISTS harvest_sync_status CASCADE;
DROP TABLE IF EXISTS cex_trades CASCADE;
DROP TABLE IF EXISTS cex_accounts CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS execution_steps CASCADE;
DROP TABLE IF EXISTS harvest_user_settings CASCADE;
DROP TABLE IF EXISTS harvest_sessions CASCADE;
DROP TABLE IF EXISTS harvest_opportunities CASCADE;
DROP TABLE IF EXISTS harvest_lots CASCADE;
```

## Edge Function Dependencies

### V1 Edge Functions
- `harvest-sync-wallets` - Uses: wallet_transactions, harvest_lots
- `harvest-sync-cex` - Uses: cex_accounts, cex_trades, harvest_lots
- `harvest-recompute-opportunities` - Uses: harvest_lots, harvest_opportunities
- `harvest-notify` - Uses: harvest_opportunities, harvest_user_settings

### V2 Edge Functions (Future)
- `harvest-economic-substance` - Uses: harvest_sessions, harvest_opportunities
- `harvest-mev-protection` - Uses: execution_steps

### V3 Edge Functions (Future)
- `harvest-kyt-screen` - Uses: sanctions_screening_logs
- `webhook-fireblocks` - Uses: harvest_sessions, execution_steps
- `webhook-copper` - Uses: harvest_sessions, execution_steps
- `harvest-twap-worker` - Uses: harvest_sessions, execution_steps

## Testing Checklist

- [ ] Run migration on clean database
- [ ] Verify all 11 tables created
- [ ] Verify all 30+ indexes created
- [ ] Verify all RLS policies active
- [ ] Verify all triggers working
- [ ] Test v1 Edge Functions with new schema
- [ ] Test user data isolation (RLS)
- [ ] Test foreign key cascades
- [ ] Test CHECK constraints
- [ ] Verify full-text search index

## Documentation References

- **Requirements**: `.kiro/specs/harvestpro/requirements.md`
- **Design**: `.kiro/specs/harvestpro/design.md`
- **Tasks**: `.kiro/specs/harvestpro/tasks.md`
- **Architecture**: `.kiro/steering/harvestpro-architecture.md`

## Change Log

### 2025-02-01 - Initial Consolidation
- Consolidated all v1, v2, and v3 tables into single migration file
- Added missing v2 fields to existing tables
- Added v3 enterprise tables (approval_requests, sanctions_screening_logs)
- Added comprehensive indexes for all query patterns
- Added complete RLS policies for all tables
- Added automated triggers for updated_at fields
- Added extensive documentation and comments

## Next Steps

1. **Review** - Have team review consolidated schema
2. **Test** - Run migration on development environment
3. **Validate** - Ensure all Edge Functions work with new schema
4. **Deploy** - Apply to staging, then production
5. **Monitor** - Watch for any migration issues or performance impacts

## Notes

- All v2 and v3 fields are **optional** (nullable) to maintain backward compatibility
- The schema supports progressive enhancement - v1 features work without v2/v3 fields
- Indexes are optimized for common query patterns identified in requirements
- RLS policies ensure multi-tenant data isolation
- Foreign key cascades ensure referential integrity
