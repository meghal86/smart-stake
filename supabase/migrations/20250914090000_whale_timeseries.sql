-- Create core tables for whale time-series, entities, transfers, and signals

-- 1) Entities registry
create table if not exists public.whale_entities (
  id bigserial primary key,
  address text not null,
  chain text not null,
  label text,
  entity_type text, -- e.g., exchange, dex, bridge, contract, defi, institution, infrastructure, wallet, other
  is_cex boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint whale_entities_unique_addr_chain unique (chain, address)
);

create index if not exists idx_whale_entities_addr_chain on public.whale_entities (address, chain);
create index if not exists idx_whale_entities_is_cex_true on public.whale_entities (is_cex) where is_cex = true;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_whale_entities_updated on public.whale_entities;
create trigger trg_whale_entities_updated
before update on public.whale_entities
for each row execute procedure public.set_updated_at();

-- 2) Balances time-series
create table if not exists public.whale_balances (
  id bigserial primary key,
  ts timestamptz not null,
  address text not null,
  chain text not null,
  token text not null,
  amount numeric not null,
  usd_value numeric not null,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_whale_balances_addr_chain on public.whale_balances (address, chain);
create index if not exists idx_whale_balances_ts on public.whale_balances (ts);

-- 3) Transfers time-series
create table if not exists public.whale_transfers (
  id bigserial primary key,
  ts timestamptz not null,
  tx_hash text not null,
  from_addr text not null,
  to_addr text not null,
  chain text not null,
  token text not null,
  amount numeric not null,
  usd_value numeric not null,
  direction text,       -- deposit | withdrawal | wallet_transfer | exchange_transfer | bridge | ...
  venue_hint text,      -- optional venue label (e.g., 'binance', 'kraken')
  is_cex boolean not null default false,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists idx_whale_transfers_from_chain on public.whale_transfers (from_addr, chain);
create index if not exists idx_whale_transfers_to_chain on public.whale_transfers (to_addr, chain);
create index if not exists idx_whale_transfers_ts on public.whale_transfers (ts);
create index if not exists idx_whale_transfers_is_cex_true on public.whale_transfers (is_cex) where is_cex = true;

-- 4) Signals time-series
create table if not exists public.whale_signals (
  id bigserial primary key,
  ts timestamptz not null,
  address text not null,
  chain text not null,
  signal_type text not null, -- e.g., accumulation, distribution, cluster_move, bridge_in, bridge_out
  intensity numeric,         -- 0..1
  meta jsonb not null default '{}'::jsonb
);

-- Backfill/compatibility: ensure columns exist if table pre-existed with different schema
alter table public.whale_signals
  add column if not exists ts timestamptz,
  add column if not exists address text,
  add column if not exists chain text,
  add column if not exists signal_type text,
  add column if not exists intensity numeric,
  add column if not exists meta jsonb;

-- Ensure sane defaults where needed to avoid null-json errors
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'whale_signals'
      and column_name = 'meta' and column_default is not null
  ) then
    execute 'alter table public.whale_signals alter column meta set default ''{}''::jsonb';
  end if;
end$$;

-- Create indexes only if target columns exist
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='whale_signals' and column_name='address'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='whale_signals' and column_name='chain'
  ) then
    execute 'create index if not exists idx_whale_signals_addr_chain on public.whale_signals (address, chain)';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='whale_signals' and column_name='ts'
  ) then
    execute 'create index if not exists idx_whale_signals_ts on public.whale_signals (ts)';
  end if;
end $$;

comment on table public.whale_entities is 'Registry of known whale entities and labels.';
comment on table public.whale_balances is 'Time-series of whale balances per address/chain/token.';
comment on table public.whale_transfers is 'Time-series of whale transfers with direction and venue hints.';
comment on table public.whale_signals is 'Time-series of whale behavior signals per address/chain.';

-- 5) Materialized view: latest per (address, chain)
--    Picks the most recent balance row per (address, chain) and enriches with entity and latest signal
drop materialized view if exists public.whale_data_cache_v2 cascade;

create materialized view public.whale_data_cache_v2 as
with latest_bal as (
  select distinct on (b.address, b.chain)
    b.address,
    b.chain,
    b.token,
    b.amount,
    b.usd_value,
    b.ts
  from public.whale_balances b
  order by b.address, b.chain, b.ts desc
),
latest_sig as (
  select distinct on (s.address, s.chain)
    s.address,
    s.chain,
    s.signal_type,
    s.intensity,
    s.meta as signal_meta,
    s.ts as signal_ts
  from public.whale_signals s
  order by s.address, s.chain, s.ts desc
)
select
  lb.address,
  lb.chain,
  lb.token,
  lb.amount,
  lb.usd_value,
  lb.ts as last_update_ts,
  coalesce(e.label, null) as entity_label,
  coalesce(e.entity_type, null) as entity_type,
  coalesce(e.is_cex, false) as is_cex,
  coalesce(e.meta, '{}'::jsonb) as entity_meta,
  ls.signal_type,
  ls.intensity as signal_intensity,
  ls.signal_meta,
  ls.signal_ts
from latest_bal lb
left join public.whale_entities e
  on e.address = lb.address and e.chain = lb.chain
left join latest_sig ls
  on ls.address = lb.address and ls.chain = lb.chain;

-- Unique index required for CONCURRENT refresh
create unique index if not exists ux_whale_data_cache_v2_addr_chain
  on public.whale_data_cache_v2 (address, chain);

-- 6) Refresh function for the MV
create or replace function public.refresh_whale_data_cache_v2()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Requires unique index to use CONCURRENTLY
  refresh materialized view concurrently public.whale_data_cache_v2;
end;
$$;

comment on materialized view public.whale_data_cache_v2 is 'Latest whale state per (address, chain) with entity/last-signal enrichment.';
comment on function public.refresh_whale_data_cache_v2() is 'Refreshes whale_data_cache_v2 concurrently for minimal lock time.';

-- 7) Back-compat: deprecate whale_data_cache by pointing to v2
-- Handle any existing object named whale_data_cache regardless of type (table/view/mview)
do $$
begin
  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'whale_data_cache' and c.relkind = 'r' -- table
  ) then
    -- Preserve legacy data by renaming, so we can create a compatibility view
    execute 'alter table public.whale_data_cache rename to whale_data_cache_legacy';
  end if;

  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'whale_data_cache' and c.relkind = 'm' -- materialized view
  ) then
    execute 'drop materialized view if exists public.whale_data_cache cascade';
  end if;

  if exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'whale_data_cache' and c.relkind = 'v' -- view
  ) then
    execute 'drop view if exists public.whale_data_cache cascade';
  end if;
end $$;

create view public.whale_data_cache as
select
  address,
  chain,
  token,
  amount,
  usd_value,
  last_update_ts,
  entity_label,
  entity_type,
  is_cex,
  entity_meta,
  signal_type,
  signal_intensity,
  signal_meta,
  signal_ts
from public.whale_data_cache_v2;

-- Optional: grants (adjust roles as needed)
-- grant select on public.whale_data_cache_v2 to anon, authenticated, service_role;
-- grant execute on function public.refresh_whale_data_cache_v2() to service_role;
