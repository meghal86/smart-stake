# 02 - Database Schema

## Primary Events Table

Create or reuse compatible table:

```sql
-- Check if compatible table exists first
-- If found, create VIEW instead of new table

create table if not exists public.events_whale(
  id uuid primary key default gen_random_uuid(),
  ts timestamptz not null,
  asset text not null,                 -- 'ETH' | 'USDT' | 'USDC' | ...
  amount_usd numeric not null,
  direction text default 'unknown',    -- 'inflow' | 'outflow' | 'unknown'
  src text default 'unknown',          -- 'cex' | 'dex' | 'unknown'
  wallet_hash text not null,
  tx_hash text not null,
  log_index int default 0,
  confidence text default 'Medium',    -- 'Low' | 'Medium' | 'High'
  meta jsonb default '{}'::jsonb
);

-- Indexes for performance
create unique index if not exists uq_events_whale_tx 
  on public.events_whale(tx_hash, log_index);
create index if not exists ix_events_whale_ts 
  on public.events_whale(ts desc);
create index if not exists ix_events_whale_amount 
  on public.events_whale(amount_usd desc);
```

## Legacy Table Compatibility

If existing table found, create mapping view:

```sql
-- Example: Map legacy 'whale_transactions' to 'events_whale'
create or replace view public.events_whale as
select 
  id,
  created_at as ts,
  token as asset,
  usd_amount as amount_usd,
  case 
    when flow_type = 'in' then 'inflow'
    when flow_type = 'out' then 'outflow'
    else 'unknown'
  end as direction,
  coalesce(source_type, 'unknown') as src,
  wallet_address as wallet_hash,
  transaction_hash as tx_hash,
  coalesce(log_idx, 0) as log_index,
  coalesce(confidence_level, 'Medium') as confidence,
  coalesce(metadata, '{}') as meta
from public.whale_transactions;
```

## Data Quality Views

```sql
-- Freshness monitoring
create or replace view public.data_freshness as
select 
  max(ts) as latest_event,
  extract(epoch from (now() - max(ts))) as age_seconds,
  case 
    when extract(epoch from (now() - max(ts))) < 180 then 'Fresh'
    when extract(epoch from (now() - max(ts))) < 600 then 'Stale'
    else 'Critical'
  end as status
from public.events_whale;

-- Volume aggregates
create or replace view public.volume_24h as
select 
  sum(amount_usd) as total_volume,
  count(*) as tx_count,
  count(distinct wallet_hash) as unique_wallets
from public.events_whale 
where ts > now() - interval '24 hours';
```

## RLS Policies

```sql
-- Enable RLS
alter table public.events_whale enable row level security;

-- Public read access
create policy "Public read access" on public.events_whale
  for select using (true);

-- Service role write access
create policy "Service role write access" on public.events_whale
  for all using (auth.role() = 'service_role');
```

---

**Next**: [Edge Functions](./03-edge-functions.md)