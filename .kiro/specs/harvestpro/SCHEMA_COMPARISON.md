# HarvestPro Schema Comparison: Before vs After

## Summary

**Before:** 9 tables (v1 only) with basic fields
**After:** 11 tables (v1 + v2 + v3) with enhanced fields

## New Tables Added

### 1. approval_requests (v3 Enterprise)
**Purpose:** Maker/checker governance for large transactions

```sql
CREATE TABLE approval_requests (
  request_id UUID PRIMARY KEY,
  session_id UUID REFERENCES harvest_sessions,
  requester_id UUID REFERENCES auth.users,
  approver_id UUID REFERENCES auth.users,
  requested_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  digital_signature TEXT,
  rejection_reason TEXT,
  metadata JSONB
);
```

**Requirements:** 27.1, 27.2, 27.3, 27.4

### 2. sanctions_screening_logs (v3 Enterprise)
**Purpose:** KYT/AML compliance audit trail

```sql
CREATE TABLE sanctions_screening_logs (
  log_id UUID PRIMARY KEY,
  session_id UUID REFERENCES harvest_sessions,
  address_checked TEXT,
  risk_score NUMERIC,
  screening_provider TEXT,
  result TEXT CHECK (result IN ('CLEAN', 'FLAGGED', 'BLOCKED')),
  flagged_reasons TEXT[],
  checked_at TIMESTAMPTZ
);
```

**Requirements:** 28.1, 28.2, 28.3, 28.4

## Enhanced Existing Tables

### harvest_lots
**New v2 Fields:**
- `chain_id INTEGER` - Multi-chain support
- `venue_type TEXT` - WALLET, CEX, or DEFI
- `venue_name TEXT` - Specific venue identifier
- `mev_risk_score NUMERIC` - MEV exposure scoring

**Requirements:** 21.1, 21.2

### harvest_opportunities
**New v2 Fields:**
- `tax_rate_used NUMERIC` - Effective tax rate applied
- `mev_risk_cost_usd NUMERIC` - MEV protection cost
- `economic_substance_flag TEXT` - PASS, WARN, or BLOCKED
- `proxy_asset_symbol TEXT` - Proxy asset for exposure maintenance

**Requirements:** 22.1, 22.2, 23.1, 23.4

### harvest_sessions
**New v2 Fields:**
- `execution_strategy TEXT` - IMMEDIATE, TWAP, or MANUAL
- `mev_protection_mode TEXT` - REQUIRED, PREFERRED, or DISABLED
- `economic_substance_status TEXT` - PASS, WARN, or BLOCKED
- `jurisdiction_code TEXT` - e.g., "US", "EU"

**New v3 Fields:**
- `status` now includes `'awaiting_approval'` state
- `custody_transaction_id TEXT` - Custody provider transaction ID

**Requirements:** 21.1, 22.1, 26.3, 27.1, 29.1

### execution_steps
**New v2 Fields:**
- `private_rpc_used BOOLEAN` - Whether private RPC was used
- `mev_protection_provider TEXT` - e.g., "Flashbots"
- `gas_paid_usd NUMERIC` - Actual gas cost
- `slippage_realized_bps INTEGER` - Actual slippage in basis points

**Requirements:** 21.2, 21.3

### harvest_user_settings
**New v2 Fields (Institutional Guardrails):**
- `max_daily_loss_usd NUMERIC` - Daily loss limit
- `max_single_trade_notional_usd NUMERIC` - Position size limit
- `max_slippage_bps INTEGER` - Slippage tolerance
- `require_private_rpc BOOLEAN` - Force private RPC usage
- `allow_cex_auto_trade BOOLEAN` - Enable CEX automation

**New v3 Fields (Custody & Compliance):**
- `custody_provider TEXT` - FIREBLOCKS, COPPER, or NONE
- `custody_api_credentials TEXT` - Encrypted co-signing credentials
- `custody_vault_id TEXT` - Vault identifier
- `approval_threshold_usd NUMERIC` - Maker/checker threshold
- `approver_role TEXT` - Required approver role
- `sanctions_screening_enabled BOOLEAN` - Enable KYT/AML
- `order_routing_strategy TEXT` - IMMEDIATE, TWAP, or VWAP
- `twap_duration_minutes INTEGER` - TWAP execution duration
- `limit_price_floor NUMERIC` - Safety floor for TWAP

**Requirements:** 24.1, 24.2, 24.3, 26.1, 27.1, 28.1, 29.1, 29.2, 29.3

## New Indexes Added

### Approval Requests
- `idx_approval_requests_session` - Session lookups
- `idx_approval_requests_approver` - Pending approvals by approver
- `idx_approval_requests_requester` - Request history by requester

### Sanctions Screening
- `idx_sanctions_logs_session` - Session audit trail
- `idx_sanctions_logs_address` - Address screening history
- `idx_sanctions_logs_result` - Flagged/blocked results

### Enhanced Existing Indexes
- `idx_harvest_lots_chain` - Multi-chain filtering
- `idx_harvest_sessions_custody` - Custody transaction tracking
- `idx_execution_steps_status` - Active step monitoring
- `idx_harvest_sync_status_last_sync` - Sync history queries

## New RLS Policies

### approval_requests
```sql
CREATE POLICY p_approval_requests_user ON approval_requests
  FOR ALL
  USING (auth.uid() = requester_id OR auth.uid() = approver_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = approver_id);
```

### sanctions_screening_logs
```sql
CREATE POLICY p_sanctions_logs_user ON sanctions_screening_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM harvest_sessions 
      WHERE harvest_sessions.session_id = sanctions_screening_logs.session_id 
      AND harvest_sessions.user_id = auth.uid()
    )
  );
```

## Field Count Comparison

| Table | Before (v1) | After (v1+v2+v3) | New Fields |
|-------|-------------|------------------|------------|
| harvest_lots | 15 | 19 | +4 |
| harvest_opportunities | 15 | 19 | +4 |
| harvest_sessions | 11 | 16 | +5 |
| execution_steps | 11 | 15 | +4 |
| harvest_user_settings | 7 | 16 | +9 |
| wallet_transactions | 9 | 9 | 0 |
| cex_accounts | 7 | 7 | 0 |
| cex_trades | 7 | 7 | 0 |
| harvest_sync_status | 10 | 10 | 0 |
| **approval_requests** | - | **9** | **NEW** |
| **sanctions_screening_logs** | - | **7** | **NEW** |

**Total Fields:** 92 → 134 (+42 fields, +2 tables)

## Index Count Comparison

| Category | Before | After | Added |
|----------|--------|-------|-------|
| User/Time indexes | 10 | 12 | +2 |
| Status indexes | 2 | 4 | +2 |
| Foreign key indexes | 4 | 4 | 0 |
| Full-text search | 1 | 1 | 0 |
| Conditional indexes | 3 | 5 | +2 |
| **Approval indexes** | - | **3** | **+3** |
| **Sanctions indexes** | - | **3** | **+3** |

**Total Indexes:** 20 → 32 (+12 indexes)

## Migration Impact

### Breaking Changes
**None.** All new fields are optional (nullable) and all new tables are independent.

### Backward Compatibility
✅ **Fully backward compatible**
- Existing v1 code continues to work
- New fields are optional
- New tables don't affect existing queries

### Performance Impact
✅ **Improved performance**
- Additional indexes speed up v2/v3 queries
- No impact on existing v1 queries
- Conditional indexes minimize overhead

### Storage Impact
- **Minimal** - New fields only consume space when populated
- **Estimated:** ~5-10% increase in table size when v2/v3 features are used
- **Negligible** when only v1 features are active

## Testing Requirements

### V1 Regression Tests
- [ ] Verify all existing v1 queries work unchanged
- [ ] Verify FIFO calculation unchanged
- [ ] Verify opportunity detection unchanged
- [ ] Verify session management unchanged

### V2 Feature Tests
- [ ] Test MEV protection fields
- [ ] Test economic substance validation
- [ ] Test institutional guardrails
- [ ] Test multi-chain support

### V3 Feature Tests
- [ ] Test approval workflow
- [ ] Test sanctions screening
- [ ] Test custody integration
- [ ] Test TWAP execution

### Integration Tests
- [ ] Test v1 Edge Functions with new schema
- [ ] Test RLS policies for new tables
- [ ] Test foreign key cascades
- [ ] Test index performance

## Deployment Checklist

- [ ] Backup existing database
- [ ] Review migration SQL
- [ ] Test on development environment
- [ ] Test on staging environment
- [ ] Verify all Edge Functions work
- [ ] Monitor performance metrics
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Update documentation

## Rollback Plan

If issues arise, the migration can be rolled back by:

1. **Drop new tables:**
```sql
DROP TABLE IF EXISTS sanctions_screening_logs CASCADE;
DROP TABLE IF EXISTS approval_requests CASCADE;
```

2. **Remove new columns:**
```sql
ALTER TABLE harvest_lots 
  DROP COLUMN IF EXISTS chain_id,
  DROP COLUMN IF EXISTS venue_type,
  DROP COLUMN IF EXISTS venue_name,
  DROP COLUMN IF EXISTS mev_risk_score;

-- Repeat for other tables...
```

3. **Restore from backup if needed**

## Questions & Answers

**Q: Do I need to update my v1 code?**
A: No. All v1 code continues to work unchanged.

**Q: When should I use v2/v3 features?**
A: Only when you need institutional or enterprise features. v1 works standalone.

**Q: Will this slow down my queries?**
A: No. New indexes improve performance, and optional fields don't impact existing queries.

**Q: Can I deploy this incrementally?**
A: Yes. Deploy the schema now, enable v2/v3 features later when ready.

**Q: What if I only want v1?**
A: The schema supports v1-only usage. Simply don't populate v2/v3 fields.
