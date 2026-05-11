-- Enum para rol dentro de la organización
create type public.org_role as enum ('owner', 'admin', 'supervisor', 'agent');

-- Enum para canal de conversación
create type public.channel_type as enum ('whatsapp', 'email', 'instagram', 'messenger', 'webchat', 'sms', 'telegram');

-- Enum para estado de conversación
create type public.conversation_status as enum ('open', 'pending', 'resolved', 'snoozed');

-- ORGANIZATIONS
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'starter',
  owner_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizations enable row level security;

-- ORG MEMBERS
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role public.org_role not null default 'agent',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
alter table public.organization_members enable row level security;
create index on public.organization_members (user_id);
create index on public.organization_members (organization_id);

-- Función security definer para chequear membresía sin recursión
create or replace function public.is_org_member(_org_id uuid, _user_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members
                 where organization_id = _org_id and user_id = _user_id)
$$;

create or replace function public.has_org_role(_org_id uuid, _user_id uuid, _roles public.org_role[])
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members
                 where organization_id = _org_id and user_id = _user_id and role = any(_roles))
$$;

-- Trigger: al crear organización, agregar al owner como miembro 'owner'
create or replace function public.handle_new_organization()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;
create trigger trg_new_organization
after insert on public.organizations
for each row execute function public.handle_new_organization();

-- updated_at triggers
create trigger trg_orgs_updated_at before update on public.organizations
for each row execute function public.set_updated_at();

-- POLICIES: organizations
create policy "Members can view their organizations"
on public.organizations for select to authenticated
using (public.is_org_member(id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));

create policy "Authenticated users can create organizations"
on public.organizations for insert to authenticated
with check (auth.uid() = owner_id);

create policy "Owners and admins can update organizations"
on public.organizations for update to authenticated
using (public.has_org_role(id, auth.uid(), array['owner','admin']::public.org_role[]) or public.has_role(auth.uid(), 'super_admin'));

create policy "Owners can delete organizations"
on public.organizations for delete to authenticated
using (public.has_org_role(id, auth.uid(), array['owner']::public.org_role[]) or public.has_role(auth.uid(), 'super_admin'));

-- POLICIES: organization_members
create policy "Members can view org members"
on public.organization_members for select to authenticated
using (public.is_org_member(organization_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));

create policy "Owners and admins can add members"
on public.organization_members for insert to authenticated
with check (public.has_org_role(organization_id, auth.uid(), array['owner','admin']::public.org_role[]) or public.has_role(auth.uid(), 'super_admin'));

create policy "Owners and admins can update members"
on public.organization_members for update to authenticated
using (public.has_org_role(organization_id, auth.uid(), array['owner','admin']::public.org_role[]) or public.has_role(auth.uid(), 'super_admin'));

create policy "Owners and admins can remove members"
on public.organization_members for delete to authenticated
using (public.has_org_role(organization_id, auth.uid(), array['owner','admin']::public.org_role[]) or public.has_role(auth.uid(), 'super_admin'));

-- CONTACTS
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  source text,
  tags text[] not null default '{}',
  notes text,
  owner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.contacts enable row level security;
create index on public.contacts (organization_id);
create trigger trg_contacts_updated_at before update on public.contacts
for each row execute function public.set_updated_at();

create policy "Org members can view contacts"
on public.contacts for select to authenticated
using (public.is_org_member(organization_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "Org members can insert contacts"
on public.contacts for insert to authenticated
with check (public.is_org_member(organization_id, auth.uid()));
create policy "Org members can update contacts"
on public.contacts for update to authenticated
using (public.is_org_member(organization_id, auth.uid()));
create policy "Org members can delete contacts"
on public.contacts for delete to authenticated
using (public.has_org_role(organization_id, auth.uid(), array['owner','admin','supervisor']::public.org_role[]));

-- PIPELINES
create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pipelines enable row level security;
create index on public.pipelines (organization_id);
create trigger trg_pipelines_updated_at before update on public.pipelines
for each row execute function public.set_updated_at();

create policy "Org members can view pipelines"
on public.pipelines for select to authenticated
using (public.is_org_member(organization_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "Owners/admins manage pipelines"
on public.pipelines for all to authenticated
using (public.has_org_role(organization_id, auth.uid(), array['owner','admin']::public.org_role[]) or public.has_role(auth.uid(), 'super_admin'))
with check (public.has_org_role(organization_id, auth.uid(), array['owner','admin']::public.org_role[]) or public.has_role(auth.uid(), 'super_admin'));

-- PIPELINE STAGES
create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  position int not null default 0,
  color text,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.pipeline_stages enable row level security;
create index on public.pipeline_stages (pipeline_id);
create index on public.pipeline_stages (organization_id);

create policy "Org members can view stages"
on public.pipeline_stages for select to authenticated
using (public.is_org_member(organization_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "Owners/admins manage stages"
on public.pipeline_stages for all to authenticated
using (public.has_org_role(organization_id, auth.uid(), array['owner','admin']::public.org_role[]) or public.has_role(auth.uid(), 'super_admin'))
with check (public.has_org_role(organization_id, auth.uid(), array['owner','admin']::public.org_role[]) or public.has_role(auth.uid(), 'super_admin'));

-- DEALS
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  stage_id uuid not null references public.pipeline_stages(id) on delete restrict,
  contact_id uuid references public.contacts(id) on delete set null,
  owner_id uuid,
  title text not null,
  value numeric(14,2) not null default 0,
  currency text not null default 'USD',
  position int not null default 0,
  expected_close_at date,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.deals enable row level security;
create index on public.deals (organization_id);
create index on public.deals (pipeline_id);
create index on public.deals (stage_id);
create trigger trg_deals_updated_at before update on public.deals
for each row execute function public.set_updated_at();

create policy "Org members can view deals"
on public.deals for select to authenticated
using (public.is_org_member(organization_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "Org members can insert deals"
on public.deals for insert to authenticated
with check (public.is_org_member(organization_id, auth.uid()));
create policy "Org members can update deals"
on public.deals for update to authenticated
using (public.is_org_member(organization_id, auth.uid()));
create policy "Owners/admins/supervisors can delete deals"
on public.deals for delete to authenticated
using (public.has_org_role(organization_id, auth.uid(), array['owner','admin','supervisor']::public.org_role[]));

-- CONVERSATIONS
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  channel public.channel_type not null,
  status public.conversation_status not null default 'open',
  assigned_to uuid,
  subject text,
  last_message_at timestamptz,
  unread_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.conversations enable row level security;
create index on public.conversations (organization_id);
create index on public.conversations (contact_id);
create trigger trg_conversations_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

create policy "Org members can view conversations"
on public.conversations for select to authenticated
using (public.is_org_member(organization_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "Org members can insert conversations"
on public.conversations for insert to authenticated
with check (public.is_org_member(organization_id, auth.uid()));
create policy "Org members can update conversations"
on public.conversations for update to authenticated
using (public.is_org_member(organization_id, auth.uid()));
create policy "Owners/admins/supervisors can delete conversations"
on public.conversations for delete to authenticated
using (public.has_org_role(organization_id, auth.uid(), array['owner','admin','supervisor']::public.org_role[]));

-- MESSAGES
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sender_user_id uuid,
  direction text not null check (direction in ('inbound','outbound','internal')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_ai boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
create index on public.messages (conversation_id);
create index on public.messages (organization_id);

create policy "Org members can view messages"
on public.messages for select to authenticated
using (public.is_org_member(organization_id, auth.uid()) or public.has_role(auth.uid(), 'super_admin'));
create policy "Org members can insert messages"
on public.messages for insert to authenticated
with check (public.is_org_member(organization_id, auth.uid()));
create policy "Org members can update messages"
on public.messages for update to authenticated
using (public.is_org_member(organization_id, auth.uid()));

-- Trigger: cuando llega un nuevo mensaje, actualizar last_message_at en la conversación
create or replace function public.touch_conversation_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
    set last_message_at = new.created_at,
        unread_count = case when new.direction = 'inbound' then unread_count + 1 else unread_count end,
        updated_at = now()
    where id = new.conversation_id;
  return new;
end;
$$;
create trigger trg_messages_touch_conversation
after insert on public.messages
for each row execute function public.touch_conversation_on_message();

-- Realtime
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.deals;