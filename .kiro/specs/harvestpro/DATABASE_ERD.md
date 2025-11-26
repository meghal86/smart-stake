# HarvestPro Database Entity Relationship Diagram

## Complete Schema Visualization

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HARVESTPRO DATABASE SCHEMA                       │
│                    v1 (Core) + v2 (Institutional) + v3 (Enterprise)     │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   auth.users         │
│   (Supabase Auth)    │
└──────────┬───────────┘
           │
           │ user_id (FK)
           │
           ├─────────────────────────────────────────────────────────────┐
           │                                                             │
           ▼                                                             │
┌──────────────────────┐                                                 │
│ harvest_user_settings│ [v1 + v2 + v3]                                 │
├──────────────────────┤                                                 │
│ • user_id (PK, FK)   │                                                 │
│ • tax_rate           │ v1: Core settings                               │
│ • notifications      │                                                 │
│ • risk_tolerance     │                                                 │
│                      │                                                 │
│ v2: Guardrails       │                                                 │
│ • max_daily_loss     │                                                 │
│ • max_trade_size     │                                                 │
│ • max_slippage       │                                                 │
│ • require_private_rpc│                                                 │
│                      │                                                 │
│ v3: Custody          │                                                 │
│ • custody_provider   │                                                 │
│ • custody_vault_id   │                                                 │
│ • approval_threshold │                                                 │
│ • sanctions_enabled  │                                                 │
│ • twap_config        │                                                 │
└──────────────────────┘                                                 │
                                                                         │
           ┌─────────────────────────────────────────────────────────────┤
           │                                                             │
           ▼                                                             │
┌──────────────────────┐                                                 │
│ wallet_transactions  │ [v1]                                            │
├──────────────────────┤                                                 │
│ • id (PK)            │                                                 │
│ • user_id (FK)       │                                                 │
│ • wallet_address     │                                                 │
│ • token              │                                                 │
│ • transaction_hash   │                                                 │
│ • transaction_type   │ (buy/sell/transfer)                            │
│ • quantity           │                                                 │
│ • price_usd          │                                                 │
│ • timestamp          │                                                 │
└──────────┬───────────┘                                                 │
           │                                                             │
           │ Used for FIFO                                               │
           │                                                             │
           ▼                                                             │
┌──────────────────────┐                                                 │
│   harvest_lots       │ [v1 + v2]                                       │
├──────────────────────┤                                                 │
│ • lot_id (PK)        │                                                 │
│ • user_id (FK)       │◄────────────────────────────────────────────────┤
│ • token              │                                                 │
│ • wallet_or_cex      │                                                 │
│ • acquired_at        │                                                 │
│ • acquired_qty       │                                                 │
│ • acquired_price_usd │                                                 │
│ • current_price_usd  │                                                 │
│ • unrealized_pnl     │                                                 │
│ • holding_period_days│                                                 │
│ • long_term          │                                                 │
│ • risk_level         │                                                 │
│ • liquidity_score    │                                                 │
│ • guardian_score     │                                                 │
│ • eligible_for_harvest│                                                │
│                      │                                                 │
│ v2: Multi-chain      │                                                 │
│ • chain_id           │                                                 │
│ • venue_type         │                                                 │
│ • venue_name         │                                                 │
│ • mev_risk_score     │                                                 │
└──────────┬───────────┘                                                 │
           │                                                             │
           │ lot_id (FK)                                                 │
           │                                                             │
           ▼                                                             │
┌──────────────────────┐                                                 │
│harvest_opportunities │ [v1 + v2]                                       │
├──────────────────────┤                                                 │
│ • id (PK)            │                                                 │
│ • lot_id (FK)        │                                                 │
│ • user_id (FK)       │◄────────────────────────────────────────────────┤
│ • token              │                                                 │
│ • token_logo_url     │                                                 │
│ • risk_level         │                                                 │
│ • unrealized_loss    │                                                 │
│ • remaining_qty      │                                                 │
│ • gas_estimate       │                                                 │
│ • slippage_estimate  │                                                 │
│ • trading_fees       │                                                 │
│ • net_tax_benefit    │                                                 │
│ • guardian_score     │                                                 │
│ • confidence         │                                                 │
│ • recommendation     │                                                 │
│                      │                                                 │
│ v2: Institutional    │                                                 │
│ • tax_rate_used      │                                                 │
│ • mev_risk_cost_usd  │                                                 │
│ • economic_substance │                                                 │
│ • proxy_asset_symbol │                                                 │
└──────────────────────┘                                                 │
                                                                         │
           ┌─────────────────────────────────────────────────────────────┤
           │                                                             │
           ▼                                                             │
┌──────────────────────┐                                                 │
│  harvest_sessions    │ [v1 + v2 + v3]                                  │
├──────────────────────┤                                                 │
│ • session_id (PK)    │                                                 │
│ • user_id (FK)       │◄────────────────────────────────────────────────┘
│ • status             │ (draft/awaiting_approval/executing/completed)
│ • opportunities      │ (JSONB array)
│ • realized_losses    │
│ • net_benefit_total  │
│ • export_url         │
│ • proof_hash         │
│                      │
│ v2: Execution        │
│ • execution_strategy │ (IMMEDIATE/TWAP/MANUAL)
│ • mev_protection_mode│
│ • economic_substance │
│ • jurisdiction_code  │
│                      │
│ v3: Custody          │
│ • custody_tx_id      │
└──────────┬───────────┘
           │
           │ session_id (FK)
           │
           ├──────────────────────────────────────┐
           │                                      │
           ▼                                      ▼
┌──────────────────────┐              ┌──────────────────────┐
│  execution_steps     │ [v1 + v2]    │  approval_requests   │ [v3]
├──────────────────────┤              ├──────────────────────┤
│ • id (PK)            │              │ • request_id (PK)    │
│ • session_id (FK)    │              │ • session_id (FK)    │
│ • step_number        │              │ • requester_id (FK)  │
│ • description        │              │ • approver_id (FK)   │
│ • type               │              │ • requested_at       │
│ • status             │              │ • approved_at        │
│ • transaction_hash   │              │ • status             │
│ • cex_platform       │              │ • digital_signature  │
│ • error_message      │              │ • rejection_reason   │
│ • guardian_score     │              │ • metadata           │
│ • timestamp          │              └──────────────────────┘
│ • duration_ms        │
│                      │              ┌──────────────────────┐
│ v2: MEV Protection   │              │sanctions_screening   │ [v3]
│ • private_rpc_used   │              │       _logs          │
│ • mev_provider       │              ├──────────────────────┤
│ • gas_paid_usd       │              │ • log_id (PK)        │
│ • slippage_realized  │              │ • session_id (FK)    │
└──────────────────────┘              │ • address_checked    │
                                      │ • risk_score         │
           ┌──────────────────────────┤ • screening_provider │
           │                          │ • result             │
           ▼                          │ • flagged_reasons    │
┌──────────────────────┐              │ • checked_at         │
│   cex_accounts       │ [v1]         └──────────────────────┘
├──────────────────────┤
│ • id (PK)            │
│ • user_id (FK)       │
│ • exchange_name      │
│ • api_key_encrypted  │
│ • api_secret_encrypt │
│ • is_active          │
│ • last_synced_at     │
└──────────┬───────────┘
           │
           │ cex_account_id (FK)
           │
           ▼
┌──────────────────────┐
│    cex_trades        │ [v1]
├──────────────────────┤
│ • id (PK)            │
│ • cex_account_id (FK)│
│ • user_id (FK)       │
│ • token              │
│ • trade_type         │
│ • quantity           │
│ • price_usd          │
│ • timestamp          │
└──────────┬───────────┘
           │
           │ Used for FIFO
           │
           └──────────────► harvest_lots


┌──────────────────────┐
│ harvest_sync_status  │ [v1]
├──────────────────────┤
│ • user_id (PK, FK)   │
│ • sync_type (PK)     │ (wallets/cex)
│ • last_sync_at       │
│ • wallets_processed  │
│ • accounts_processed │
│ • transactions_found │
│ • trades_found       │
│ • errors             │
│ • status             │
└──────────────────────┘
```

## Relationship Summary

### Primary Relationships

1. **auth.users → harvest_user_settings** (1:1)
   - Each user has one settings record

2. **auth.users → wallet_transactions** (1:N)
   - Users can have many wallet transactions

3. **auth.users → cex_accounts** (1:N)
   - Users can link multiple CEX accounts

4. **cex_accounts → cex_trades** (1:N)
   - Each CEX account has many trades

5. **wallet_transactions + cex_trades → harvest_lots** (N:1)
   - Transactions are aggregated into lots via FIFO

6. **harvest_lots → harvest_opportunities** (1:N)
   - Each lot can generate multiple opportunities (different strategies)

7. **harvest_sessions → execution_steps** (1:N)
   - Each session has multiple execution steps

8. **harvest_sessions → approval_requests** (1:1) [v3]
   - Sessions requiring approval have one request

9. **harvest_sessions → sanctions_screening_logs** (1:N) [v3]
   - Each session can have multiple addresses screened

### Data Flow

```
User Connects Wallet/CEX
         ↓
wallet_transactions / cex_trades
         ↓
FIFO Engine (Edge Function)
         ↓
harvest_lots
         ↓
Opportunity Detection (Edge Function)
         ↓
harvest_opportunities
         ↓
User Selects Opportunities
         ↓
harvest_sessions (draft)
         ↓
[v3] Approval Check → approval_requests
         ↓
[v3] Sanctions Screen → sanctions_screening_logs
         ↓
harvest_sessions (executing)
         ↓
execution_steps
         ↓
harvest_sessions (completed)
         ↓
Export & Proof
```

## Table Categories

### Core Data (v1)
- `harvest_lots` - Source of truth for holdings
- `harvest_opportunities` - Actionable opportunities
- `harvest_sessions` - Execution tracking
- `execution_steps` - Step-by-step progress

### User Data (v1)
- `harvest_user_settings` - Preferences and configuration
- `wallet_transactions` - On-chain transaction history
- `cex_accounts` - Exchange account links
- `cex_trades` - Exchange trade history

### System Data (v1)
- `harvest_sync_status` - Sync health monitoring

### Governance (v3)
- `approval_requests` - Maker/checker workflow

### Compliance (v3)
- `sanctions_screening_logs` - KYT/AML audit trail

## Foreign Key Cascade Behavior

All foreign keys use `ON DELETE CASCADE` to ensure referential integrity:

- Deleting a user deletes all their data
- Deleting a session deletes all execution steps
- Deleting a session deletes approval requests
- Deleting a session deletes sanctions logs
- Deleting a lot deletes opportunities
- Deleting a CEX account deletes trades

## Index Strategy

### User-Scoped Queries
Every table with `user_id` has an index: `(user_id, created_at DESC)`

### Status Filtering
Tables with status fields have indexes: `(user_id, status)`

### Time-Series Queries
Timestamp fields have descending indexes for recent-first queries

### Full-Text Search
Token names use trigram indexes for fuzzy matching

### Conditional Indexes
Active records use partial indexes: `WHERE is_active = TRUE`

## Security Model

### Row Level Security (RLS)
All tables enforce user-scoped access via RLS policies

### Encryption
- CEX API credentials encrypted at application level
- Custody credentials encrypted at application level

### Audit Trail
- All tables have `created_at` timestamps
- Key tables have `updated_at` timestamps
- Sanctions screening provides compliance audit trail
- Approval requests provide governance audit trail

## Performance Characteristics

### Read Performance
- User-scoped queries: O(log n) via indexes
- Status filtering: O(log n) via composite indexes
- Token search: O(1) via trigram indexes

### Write Performance
- Inserts: O(log n) for index updates
- Updates: O(log n) for index updates
- Cascading deletes: O(n) for related records

### Storage
- Base tables: ~1KB per row average
- JSONB fields: Variable, typically 1-10KB
- Indexes: ~30% overhead on table size

## Scalability Considerations

### Partitioning Strategy (Future)
- `wallet_transactions` by timestamp (monthly)
- `cex_trades` by timestamp (monthly)
- `harvest_sessions` by created_at (yearly)

### Archival Strategy (Future)
- Archive completed sessions > 1 year old
- Archive transactions > 2 years old
- Maintain audit trail for compliance

### Caching Strategy
- Opportunities: 5 minute TTL
- Guardian scores: 1 hour TTL
- Prices: 1 minute TTL
- User settings: Infinite (invalidate on update)
