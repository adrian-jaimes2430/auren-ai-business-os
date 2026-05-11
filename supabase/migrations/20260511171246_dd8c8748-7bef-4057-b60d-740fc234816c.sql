
do $$
begin
  if not exists (select 1 from pg_type where typname = 'channel_provider') then
    create type public.channel_provider as enum ('whatsapp','instagram','messenger','email','sms','webchat');
  end if;
end$$;

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  provider channel_provider not null,
  name text not null,
  external_id text,
  verify_token text not null default encode(gen_random_bytes(16), 'hex'),
  access_token text,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_channels_org on public.channels(organization_id);
create index if not exists idx_channels_external on public.channels(provider, external_id);

alter table public.channels enable row level security;

create policy "Org members can view channels"
  on public.channels for select to authenticated
  using (is_org_member(organization_id, auth.uid()) or has_role(auth.uid(),'super_admin'::app_role));

create policy "Owners/admins manage channels"
  on public.channels for all to authenticated
  using (has_org_role(organization_id, auth.uid(), array['owner'::org_role,'admin'::org_role]) or has_role(auth.uid(),'super_admin'::app_role))
  with check (has_org_role(organization_id, auth.uid(), array['owner'::org_role,'admin'::org_role]) or has_role(auth.uid(),'super_admin'::app_role));

create trigger trg_channels_updated_at
  before update on public.channels
  for each row execute function public.set_updated_at();
