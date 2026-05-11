
create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  email text not null,
  role org_role not null default 'agent',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending',
  invited_by uuid,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists idx_org_inv_org on public.organization_invitations(organization_id);
create index if not exists idx_org_inv_email on public.organization_invitations(lower(email));

alter table public.organization_invitations enable row level security;

create policy "Owners/admins manage invitations"
  on public.organization_invitations for all to authenticated
  using (has_org_role(organization_id, auth.uid(), array['owner'::org_role,'admin'::org_role]) or has_role(auth.uid(),'super_admin'::app_role))
  with check (has_org_role(organization_id, auth.uid(), array['owner'::org_role,'admin'::org_role]) or has_role(auth.uid(),'super_admin'::app_role));

create policy "Authenticated users can view invitations"
  on public.organization_invitations for select to authenticated
  using (true);

-- Accept invitation function
create or replace function public.accept_invitation(_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.organization_invitations%rowtype;
  user_email text;
begin
  select email into user_email from auth.users where id = auth.uid();
  if user_email is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv from public.organization_invitations
    where token = _token and status = 'pending' and expires_at > now()
    limit 1;
  if inv.id is null then
    raise exception 'Invitación inválida o expirada';
  end if;

  if lower(inv.email) <> lower(user_email) then
    raise exception 'Esta invitación no corresponde a tu email';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
    values (inv.organization_id, auth.uid(), inv.role)
    on conflict (organization_id, user_id) do update set role = excluded.role;

  update public.organization_invitations
    set status = 'accepted', accepted_at = now()
    where id = inv.id;

  return inv.organization_id;
end;
$$;

-- Ensure org_members unique constraint exists
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organization_members_org_user_unique'
  ) then
    alter table public.organization_members
      add constraint organization_members_org_user_unique unique (organization_id, user_id);
  end if;
end$$;
