-- Plan tiers
create type plan_tier as enum ('LITE','PRO','ENTERPRISE');

-- User profile
create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  plan plan_tier not null default 'LITE',
  streak_count int not null default 0,
  last_seen_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Whale digest events
create table public.whale_digest (
  id bigserial primary key,
  event_time timestamptz not null,
  asset text not null,
  summary text not null,
  severity int not null check (severity between 1 and 5),
  source text not null,
  created_at timestamptz default now()
);
create index on public.whale_digest (event_time desc);

-- Whale index daily score
create table public.whale_index (
  id bigserial primary key,
  date date not null unique,
  score int not null check (score between 0 and 100),
  label text not null
);

-- Token unlocks
create table public.token_unlocks (
  id bigserial primary key,
  token text not null,
  chain text,
  unlock_time timestamptz not null,
  amount_usd numeric,
  source text,
  created_at timestamptz default now()
);
create index on public.token_unlocks (unlock_time);

-- RLS Policies
alter table public.user_profiles enable row level security;
create policy "own profile select" on public.user_profiles
for select using (auth.uid() = user_id);
create policy "own profile update" on public.user_profiles
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);
create policy "own profile insert" on public.user_profiles
for insert with check (auth.uid() = user_id);

alter table public.whale_digest enable row level security;
create policy "read digest" on public.whale_digest for select using (true);

alter table public.whale_index enable row level security;
create policy "read index" on public.whale_index for select using (true);

alter table public.token_unlocks enable row level security;
create policy "read unlocks" on public.token_unlocks for select using (true);

-- Function to update user profile on auth user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, handle)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
