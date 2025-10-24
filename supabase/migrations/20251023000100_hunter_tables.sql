-- Hunter (Opportunity Feed) schema
-- Opportunities
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  protocol text not null,
  type text check (type in ('airdrop','quest','staking','yield')) not null,
  chains text[] not null default '{}',

  -- Rewards
  reward_min numeric,
  reward_max numeric,
  reward_currency text check (reward_currency in ('USD','ETH','POINTS')) default 'USD',
  reward_confidence text check (reward_confidence in ('confirmed','estimated','speculative')) default 'estimated',

  -- Difficulty & time
  difficulty text check (difficulty in ('easy','medium','hard')) default 'medium',
  time_required text,

  -- Safety (cached from Guardian)
  trust_score int default 100,
  is_verified boolean default false,
  audited boolean default false,

  -- Timeline
  start_date timestamptz default now(),
  end_date timestamptz,
  urgency text check (urgency in ('high','medium','low')) default 'low',

  -- Requirements (JSON)
  requirements jsonb default '{}'::jsonb,

  -- Steps
  steps jsonb default '[]'::jsonb,

  -- Categorization
  category text[] default '{}',
  tags text[] default '{}',
  featured boolean default false,

  -- Live stats
  participants integer,
  apr numeric,
  apy numeric,
  tvl_usd numeric,

  -- Media
  thumbnail text,
  banner text,
  protocol_logo text,

  -- Source metadata
  source text,
  source_ref text,
  protocol_address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_opportunities (
  user_id uuid references public.user_profiles(user_id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  status text check (status in ('started','completed')) not null default 'started',
  completed_at timestamptz,
  actual_reward numeric,
  primary key (user_id, opportunity_id)
);

create table if not exists public.eligibility_cache (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  eligible boolean not null,
  reasons jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_opps_type on public.opportunities (type);
create index if not exists idx_opps_end_date on public.opportunities (end_date);
create index if not exists idx_opps_featured on public.opportunities (featured);
create index if not exists idx_elig_wallet on public.eligibility_cache (wallet_address);

-- RLS policies
alter table public.opportunities enable row level security;
create policy if not exists "opps public read" on public.opportunities for select using (true);

alter table public.user_opportunities enable row level security;
create policy if not exists "uopp owner all" on public.user_opportunities
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.eligibility_cache enable row level security;
create policy if not exists "elig public read" on public.eligibility_cache for select using (true);
create policy if not exists "elig service insert" on public.eligibility_cache for insert with check (true);
