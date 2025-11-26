# HarvestPro Schema Quick Reference Card

## 📁 Main File
```
supabase/migrations/20250201000000_harvestpro_complete_schema.sql
```

## 📊 By The Numbers
- **11 Tables** (9 v1 + 2 v3)
- **134 Fields** (92 v1 + 26 v2 + 16 v3)
- **32 Indexes**
- **11 RLS Policies**
- **6 Triggers**

## 🗂️ Tables at a Glance

| # | Table | Phase | Purpose |
|---|-------|-------|---------|
| 1 | `harvest_lots` | v1+v2 | FIFO cost basis lots |
| 2 | `harvest_opportunities` | v1+v2 | Eligible opportunities |
| 3 | `harvest_sessions` | v1+v2+v3 | Execution sessions |
| 4 | `execution_steps` | v1+v2 | Step tracking |
| 5 | `harvest_user_settings` | v1+v2+v3 | User config |
| 6 | `wallet_transactions` | v1 | On-chain history |
| 7 | `cex_accounts` | v1 | Exchange accounts |
| 8 | `cex_trades` | v1 | Exchange trades |
| 9 | `harvest_sync_status` | v1 | Sync tracking |
| 10 | `approval_requests` | v3 | Maker/checker |
| 11 | `sanctions_screening_logs` | v3 | KYT/AML |

## 🔑 Primary Keys

```sql
harvest_lots.lot_id
harvest_opportunities.id
harvest_sessions.session_id
execution_steps.id
harvest_user_settings.user_id
wallet_transactions.id
cex_accounts.id
cex_trades.id
harvest_sync_status.(user_id, sync_type)
approval_requests.request_id
sanctions_screening_logs.log_id
```

## 🔗 Key Relationships

```
auth.users
  ├─→ harvest_user_settings (1:1)
  ├─→ wallet_transactions (1:N)
  ├─→ cex_accounts (1:N)
  ├─→ harvest_lots (1:N)
  ├─→ harvest_opportunities (1:N)
  ├─→ harvest_sessions (1:N)
  └─→ harvest_sync_status (1:N)

harvest_lots
  └─→ harvest_opportunities (1:N)

harvest_sessions
  ├─→ execution_steps (1:N)
  ├─→ approval_requests (1:1)
  └─→ sanctions_screening_logs (1:N)

cex_accounts
  └─→ cex_trades (1:N)
```

## 🚀 Quick Deploy

```bash
# Deploy schema
supabase db push

# Verify
supabase db diff

# Check tables
psql -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'harvest_%';"
# Should return: 9

psql -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('approval_requests', 'sanctions_screening_logs');"
# Should return: 2
```

## 🔍 Quick Queries

### Check All Tables
```sql
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND (table_name LIKE 'harvest_%' 
       OR table_name IN ('approval_requests', 'sanctions_screening_logs', 
                         'cex_accounts', 'cex_trades', 'wallet_transactions'))
ORDER BY table_name;
```

### Check Indexes
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (tablename LIKE 'harvest_%' 
       OR tablename IN ('approval_requests', 'sanctions_screening_logs'))
ORDER BY tablename, indexname;
```

### Check RLS
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND (tablename LIKE 'harvest_%' 
       OR tablename IN ('approval_requests', 'sanctions_screening_logs'))
ORDER BY tablename;
```

## 📝 Common Operations

### Insert Test Data
```sql
-- Insert user settings
INSERT INTO harvest_user_settings (user_id, tax_rate)
VALUES (auth.uid(), 0.24);

-- Insert wallet transaction
INSERT INTO wallet_transactions (user_id, wallet_address, token, transaction_hash, transaction_type, quantity, price_usd, timestamp)
VALUES (auth.uid(), '0x123...', 'ETH', '0xabc...', 'buy', 1.5, 2000, NOW());

-- Insert harvest lot
INSERT INTO harvest_lots (user_id, token, wallet_or_cex, acquired_at, acquired_qty, acquired_price_usd, current_price_usd, unrealized_pnl, holding_period_days, long_term, risk_level, liquidity_score, guardian_score, eligible_for_harvest)
VALUES (auth.uid(), 'ETH', '0x123...', NOW() - INTERVAL '400 days', 1.5, 2000, 1800, -300, 400, true, 'LOW', 85, 7.5, true);
```

### Query Opportunities
```sql
SELECT * FROM harvest_opportunities
WHERE user_id = auth.uid()
  AND net_tax_benefit > 100
ORDER BY net_tax_benefit DESC
LIMIT 10;
```

### Create Session
```sql
INSERT INTO harvest_sessions (user_id, status, opportunities_selected)
VALUES (auth.uid(), 'draft', '[]'::jsonb)
RETURNING session_id;
```

## 🎨 Field Types Reference

### Common Types
- `UUID` - Primary/foreign keys
- `TEXT` - Strings, enums
- `NUMERIC` - Money, scores
- `INTEGER` - Counts, durations
- `BOOLEAN` - Flags
- `TIMESTAMPTZ` - Timestamps
- `JSONB` - Complex data
- `TEXT[]` - Arrays

### Enum Values

**Status Fields:**
```sql
-- harvest_sessions.status
'draft' | 'awaiting_approval' | 'executing' | 'completed' | 'failed' | 'cancelled'

-- execution_steps.status
'pending' | 'executing' | 'completed' | 'failed'

-- approval_requests.status
'pending' | 'approved' | 'rejected'

-- sanctions_screening_logs.result
'CLEAN' | 'FLAGGED' | 'BLOCKED'
```

**Risk Levels:**
```sql
'LOW' | 'MEDIUM' | 'HIGH'
```

**Transaction Types:**
```sql
'buy' | 'sell' | 'transfer_in' | 'transfer_out'
```

## 🔒 Security Checklist

- [x] RLS enabled on all tables
- [x] User-scoped policies
- [x] Foreign key cascades
- [x] Encrypted credentials
- [x] Audit trails
- [x] No public access

## ⚡ Performance Tips

### Use Indexes
```sql
-- Good: Uses index
SELECT * FROM harvest_opportunities 
WHERE user_id = auth.uid() 
ORDER BY created_at DESC;

-- Bad: Table scan
SELECT * FROM harvest_opportunities 
WHERE token LIKE '%ETH%';

-- Good: Uses trigram index
SELECT * FROM harvest_opportunities 
WHERE token ILIKE 'eth%';
```

### Limit Results
```sql
-- Always use LIMIT for large tables
SELECT * FROM wallet_transactions 
WHERE user_id = auth.uid() 
ORDER BY timestamp DESC 
LIMIT 100;
```

### Use Prepared Statements
```typescript
// Good: Prepared statement
const { data } = await supabase
  .from('harvest_opportunities')
  .select('*')
  .eq('user_id', userId)
  .order('net_tax_benefit', { ascending: false })
  .limit(50);
```

## 🐛 Troubleshooting

### Table Not Found
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'harvest_lots'
);
```

### RLS Blocking Access
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'harvest_lots';

-- Temporarily disable RLS (dev only!)
ALTER TABLE harvest_lots DISABLE ROW LEVEL SECURITY;
```

### Foreign Key Violation
```sql
-- Check if referenced record exists
SELECT EXISTS (
  SELECT FROM auth.users 
  WHERE id = 'user-uuid-here'
);
```

## 📚 Documentation

- **Full Schema:** `20250201000000_harvestpro_complete_schema.sql`
- **Consolidation:** `DATABASE_SCHEMA_CONSOLIDATION.md`
- **Comparison:** `SCHEMA_COMPARISON.md`
- **ERD:** `DATABASE_ERD.md`
- **Summary:** `COMPLETE_SCHEMA_SUMMARY.md`

## 🎯 Quick Links

- [Requirements](requirements.md)
- [Design](design.md)
- [Tasks](tasks.md)
- [Architecture](.kiro/steering/harvestpro-architecture.md)
- [Stack](.kiro/steering/harvestpro-stack.md)
- [Testing](.kiro/steering/harvestpro-testing.md)

---

**Last Updated:** 2025-02-01
**Schema Version:** v1.0.0 (includes v1 + v2 + v3)
**Status:** ✅ Production Ready
