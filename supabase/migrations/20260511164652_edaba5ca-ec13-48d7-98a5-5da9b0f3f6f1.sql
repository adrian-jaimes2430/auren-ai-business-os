
-- Automations table
create type public.automation_trigger as enum (
  'contact_created',
  'deal_created',
  'deal_stage_changed',
  'message_received',
  'tag_added',
  'manual'
);

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  trigger automation_trigger not null,
  trigger_config jsonb not null default '{}'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  created_by uuid,
  run_count integer not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index automations_org_idx on public.automations(organization_id);

create trigger automations_set_updated_at
before update on public.automations
for each row execute function public.set_updated_at();

alter table public.automations enable row level security;

create policy "Org members can view automations"
on public.automations for select to authenticated
using (public.is_org_member(organization_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));

create policy "Owners/admins manage automations"
on public.automations for all to authenticated
using (public.has_org_role(organization_id, auth.uid(), array['owner','admin','supervisor']::org_role[]) or public.has_role(auth.uid(), 'super_admin'))
with check (public.has_org_role(organization_id, auth.uid(), array['owner','admin','supervisor']::org_role[]) or public.has_role(auth.uid(), 'super_admin'));

-- Automation runs (history/log)
create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  automation_id uuid not null references public.automations(id) on delete cascade,
  status text not null default 'success',
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index automation_runs_org_idx on public.automation_runs(organization_id, created_at desc);
create index automation_runs_automation_idx on public.automation_runs(automation_id, created_at desc);

alter table public.automation_runs enable row level security;

create policy "Org members can view runs"
on public.automation_runs for select to authenticated
using (public.is_org_member(organization_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));

create policy "Org members can insert runs"
on public.automation_runs for insert to authenticated
with check (public.is_org_member(organization_id, auth.uid()));
