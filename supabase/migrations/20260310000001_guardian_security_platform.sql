-- Guardian security platform foundation
-- Real scan persistence, evidence ledger, remediation tracking,
-- alert events, org posture, and automation tables.

create extension if not exists pgcrypto;

create or replace function public.guardian_handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.guardian_wallet_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  wallet_address_lc text not null,
  network text not null default 'ethereum',
  chain_id integer not null default 1,
  trust_score integer not null check (trust_score between 0 and 100),
  risk_score numeric(5,2) not null check (risk_score between 0 and 10),
  risk_level text not null check (risk_level in ('Low', 'Medium', 'High', 'Critical')),
  status_label text not null,
  status_tone text not null check (status_tone in ('trusted', 'warning', 'danger')),
  confidence numeric(5,4) not null default 0.3 check (confidence between 0 and 1),
  findings_count integer not null default 0,
  approvals_count integer not null default 0,
  recommended_actions jsonb not null default '[]'::jsonb,
  evidence_summary jsonb not null default '{}'::jsonb,
  score_factors jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  request_id text,
  data_source text not null default 'live' check (data_source in ('live', 'demo')),
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_guardian_wallet_scans_user_scanned
  on public.guardian_wallet_scans(user_id, scanned_at desc);
create index if not exists idx_guardian_wallet_scans_wallet_scanned
  on public.guardian_wallet_scans(wallet_address_lc, scanned_at desc);
create index if not exists idx_guardian_wallet_scans_request_id
  on public.guardian_wallet_scans(request_id);

create table if not exists public.guardian_wallet_findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.guardian_wallet_scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  wallet_address_lc text not null,
  network text not null default 'ethereum',
  finding_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical', 'unknown')),
  description text not null,
  recommendation text,
  source text,
  source_ref text,
  contract_address text,
  tx_hash text,
  evidence jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_guardian_wallet_findings_scan
  on public.guardian_wallet_findings(scan_id);
create index if not exists idx_guardian_wallet_findings_wallet
  on public.guardian_wallet_findings(wallet_address_lc, created_at desc);

create table if not exists public.guardian_wallet_approvals (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.guardian_wallet_scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  wallet_address_lc text not null,
  network text not null default 'ethereum',
  token_symbol text,
  token_address text not null,
  spender text not null,
  spender_name text,
  allowance text not null,
  allowance_numeric numeric,
  is_unlimited boolean not null default false,
  approved_at timestamptz,
  last_used_at timestamptz,
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  usd_value numeric,
  evidence jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_guardian_wallet_approvals_scan
  on public.guardian_wallet_approvals(scan_id);
create index if not exists idx_guardian_wallet_approvals_wallet
  on public.guardian_wallet_approvals(wallet_address_lc, created_at desc);
create index if not exists idx_guardian_wallet_approvals_spender
  on public.guardian_wallet_approvals(spender, created_at desc);

create table if not exists public.guardian_alert_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  wallet_address_lc text not null,
  scan_id uuid references public.guardian_wallet_scans(id) on delete set null,
  alert_type text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  body text not null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  dedupe_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_guardian_alert_events_dedupe_key
  on public.guardian_alert_events(dedupe_key)
  where dedupe_key is not null;
create index if not exists idx_guardian_alert_events_user_created
  on public.guardian_alert_events(user_id, created_at desc);

create table if not exists public.guardian_remediation_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  wallet_address_lc text not null,
  scan_id uuid references public.guardian_wallet_scans(id) on delete set null,
  operation_type text not null default 'revoke' check (operation_type in ('revoke', 'batch_revoke', 'review')),
  network text not null default 'ethereum',
  token_address text,
  spender text,
  status text not null default 'prepared' check (
    status in ('prepared', 'requested', 'broadcast', 'confirmed', 'failed', 'cancelled')
  ),
  idempotency_key text unique,
  tx_hash text,
  gas_estimate bigint,
  score_delta_min integer,
  score_delta_max integer,
  simulation jsonb not null default '{}'::jsonb,
  receipt jsonb not null default '{}'::jsonb,
  error_message text,
  requested_at timestamptz not null default now(),
  confirmed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_guardian_remediation_operations_user_requested
  on public.guardian_remediation_operations(user_id, requested_at desc);

create table if not exists public.guardian_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope_type text not null check (scope_type in ('wallet', 'portfolio', 'org')),
  scope_key text not null,
  export_format text not null default 'json' check (export_format in ('json', 'csv', 'markdown')),
  summary jsonb not null default '{}'::jsonb,
  posture jsonb not null default '{}'::jsonb,
  trend jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create index if not exists idx_guardian_reports_user_generated
  on public.guardian_reports(user_id, generated_at desc);

create table if not exists public.guardian_automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text,
  status text not null default 'active' check (status in ('active', 'paused', 'disabled')),
  trigger_type text not null default 'threshold_drop' check (
    trigger_type in ('threshold_drop', 'new_high_risk_approval', 'scheduled_scan', 'stale_scan')
  ),
  threshold numeric(5,2),
  stale_after_hours integer default 168,
  gas_policy text not null default 'sponsored' check (
    gas_policy in ('sponsored', 'user_paid', 'threshold_only')
  ),
  notification_channels jsonb not null default '{"email":true,"push":false}'::jsonb,
  smart_wallet_address text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guardian_automation_policies (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.guardian_automations(id) on delete cascade,
  policy_type text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guardian_automation_logs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.guardian_automations(id) on delete cascade,
  event_type text not null,
  status text not null default 'success' check (status in ('success', 'warning', 'error')),
  wallet_address text,
  tx_hash text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_guardian_automations_user_id
  on public.guardian_automations(user_id, created_at desc);
create index if not exists idx_guardian_automation_logs_automation_id
  on public.guardian_automation_logs(automation_id, created_at desc);

drop trigger if exists trg_guardian_alert_events_updated_at on public.guardian_alert_events;
create trigger trg_guardian_alert_events_updated_at
  before update on public.guardian_alert_events
  for each row execute function public.guardian_handle_updated_at();

drop trigger if exists trg_guardian_remediation_operations_updated_at on public.guardian_remediation_operations;
create trigger trg_guardian_remediation_operations_updated_at
  before update on public.guardian_remediation_operations
  for each row execute function public.guardian_handle_updated_at();

drop trigger if exists trg_guardian_automations_updated_at on public.guardian_automations;
create trigger trg_guardian_automations_updated_at
  before update on public.guardian_automations
  for each row execute function public.guardian_handle_updated_at();

drop trigger if exists trg_guardian_automation_policies_updated_at on public.guardian_automation_policies;
create trigger trg_guardian_automation_policies_updated_at
  before update on public.guardian_automation_policies
  for each row execute function public.guardian_handle_updated_at();

alter table public.guardian_wallet_scans enable row level security;
alter table public.guardian_wallet_findings enable row level security;
alter table public.guardian_wallet_approvals enable row level security;
alter table public.guardian_alert_events enable row level security;
alter table public.guardian_remediation_operations enable row level security;
alter table public.guardian_reports enable row level security;
alter table public.guardian_automations enable row level security;
alter table public.guardian_automation_policies enable row level security;
alter table public.guardian_automation_logs enable row level security;

drop policy if exists "guardian_wallet_scans_owner_read" on public.guardian_wallet_scans;
create policy "guardian_wallet_scans_owner_read" on public.guardian_wallet_scans
  for select using (auth.uid() = user_id);
drop policy if exists "guardian_wallet_scans_owner_insert" on public.guardian_wallet_scans;
create policy "guardian_wallet_scans_owner_insert" on public.guardian_wallet_scans
  for insert with check (auth.uid() = user_id);

drop policy if exists "guardian_wallet_findings_owner_read" on public.guardian_wallet_findings;
create policy "guardian_wallet_findings_owner_read" on public.guardian_wallet_findings
  for select using (auth.uid() = user_id);
drop policy if exists "guardian_wallet_findings_owner_insert" on public.guardian_wallet_findings;
create policy "guardian_wallet_findings_owner_insert" on public.guardian_wallet_findings
  for insert with check (auth.uid() = user_id);

drop policy if exists "guardian_wallet_approvals_owner_read" on public.guardian_wallet_approvals;
create policy "guardian_wallet_approvals_owner_read" on public.guardian_wallet_approvals
  for select using (auth.uid() = user_id);
drop policy if exists "guardian_wallet_approvals_owner_insert" on public.guardian_wallet_approvals;
create policy "guardian_wallet_approvals_owner_insert" on public.guardian_wallet_approvals
  for insert with check (auth.uid() = user_id);

drop policy if exists "guardian_alert_events_owner_all" on public.guardian_alert_events;
create policy "guardian_alert_events_owner_all" on public.guardian_alert_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "guardian_remediation_operations_owner_all" on public.guardian_remediation_operations;
create policy "guardian_remediation_operations_owner_all" on public.guardian_remediation_operations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "guardian_reports_owner_all" on public.guardian_reports;
create policy "guardian_reports_owner_all" on public.guardian_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "guardian_automations_owner_all" on public.guardian_automations;
create policy "guardian_automations_owner_all" on public.guardian_automations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "guardian_automation_policies_owner_all" on public.guardian_automation_policies;
create policy "guardian_automation_policies_owner_all" on public.guardian_automation_policies
  for all using (
    exists (
      select 1
      from public.guardian_automations ga
      where ga.id = guardian_automation_policies.automation_id
        and ga.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.guardian_automations ga
      where ga.id = guardian_automation_policies.automation_id
        and ga.user_id = auth.uid()
    )
  );

drop policy if exists "guardian_automation_logs_owner_read" on public.guardian_automation_logs;
create policy "guardian_automation_logs_owner_read" on public.guardian_automation_logs
  for select using (
    exists (
      select 1
      from public.guardian_automations ga
      where ga.id = guardian_automation_logs.automation_id
        and ga.user_id = auth.uid()
    )
  );

create or replace view public.guardian_latest_wallet_posture as
with ranked_scans as (
  select
    scan.*,
    row_number() over (
      partition by scan.user_id, scan.wallet_address_lc, scan.network
      order by scan.scanned_at desc
    ) as rn
  from public.guardian_wallet_scans scan
)
select
  id,
  user_id,
  wallet_address,
  wallet_address_lc,
  network,
  chain_id,
  trust_score,
  risk_score,
  risk_level,
  status_label,
  status_tone,
  confidence,
  findings_count,
  approvals_count,
  recommended_actions,
  evidence_summary,
  score_factors,
  data_source,
  request_id,
  scanned_at
from ranked_scans
where rn = 1;

create or replace view public.guardian_org_posture as
select
  p.user_id,
  count(*) as wallet_count,
  round(avg(p.trust_score)::numeric, 2) as average_trust_score,
  round(avg(p.risk_score)::numeric, 2) as average_risk_score,
  max(p.scanned_at) as last_scanned_at,
  sum(case when p.risk_level in ('High', 'Critical') then 1 else 0 end) as high_risk_wallets,
  sum(p.findings_count) as total_findings,
  sum(p.approvals_count) as total_approvals
from public.guardian_latest_wallet_posture p
group by p.user_id;

grant select on public.guardian_latest_wallet_posture to authenticated;
grant select on public.guardian_org_posture to authenticated;
