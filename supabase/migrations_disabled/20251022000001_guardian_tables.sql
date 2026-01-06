-- Guardian Trust & Safety Tables
-- Create users table if it doesn't exist
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique,
  tier text default 'free' check (tier in ('free', 'pro', 'enterprise')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create scans table for Guardian scan history
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  scan_type text check (scan_type in ('wallet', 'contract')) default 'wallet',
  target_address text not null,
  trust_score int not null check (trust_score >= 0 and trust_score <= 100),
  grade text not null check (grade in ('A', 'B', 'C', 'D', 'F')),
  risk_factors jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Index for faster queries
create index if not exists idx_scans_user_id on public.scans(user_id);
create index if not exists idx_scans_target_address on public.scans(target_address);
create index if not exists idx_scans_created_at on public.scans(created_at desc);

-- User preferences table
create table if not exists public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  auto_monitor boolean default false,
  notification_channels jsonb default '{"email": true, "push": false}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Guardian scans view for the existing service
create or replace view public.guardian_scans as
select
  s.id as guardian_scan_id,
  s.target_address as wallet_address,
  COALESCE((s.meta->>'chain')::text, 'ethereum') as network,
  s.trust_score / 100.0 as trust_score,
  (100 - s.trust_score) / 10.0 as risk_score,
  case
    when s.trust_score >= 80 then 'Low'
    when s.trust_score >= 60 then 'Medium'
    else 'High'
  end as risk_level,
  s.risk_factors as flags,
  s.created_at as last_scan
from public.scans s
where s.scan_type = 'wallet';

-- Enable Row Level Security
alter table public.scans enable row level security;
alter table public.user_preferences enable row level security;

-- RLS Policies for scans
drop policy if exists "scans_owner_read" on public.scans;
create policy "scans_owner_read" on public.scans
  for select using (auth.uid() = user_id);

drop policy if exists "scans_owner_insert" on public.scans;
create policy "scans_owner_insert" on public.scans
  for insert with check (auth.uid() = user_id);

drop policy if exists "scans_owner_update" on public.scans;
create policy "scans_owner_update" on public.scans
  for update using (auth.uid() = user_id);

-- RLS Policies for user_preferences
drop policy if exists "prefs_owner_all" on public.user_preferences;
create policy "prefs_owner_all" on public.user_preferences
  for all using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
drop trigger if exists handle_users_updated_at on public.users;
create trigger handle_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

drop trigger if exists handle_prefs_updated_at on public.user_preferences;
create trigger handle_prefs_updated_at
  before update on public.user_preferences
  for each row execute function public.handle_updated_at();

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.scans to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select on public.guardian_scans to authenticated, anon;

