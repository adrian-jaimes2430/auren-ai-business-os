
alter table public.organizations
  add column if not exists logo_url text,
  add column if not exists brand_color text,
  add column if not exists timezone text default 'UTC',
  add column if not exists locale text default 'es',
  add column if not exists website text;

insert into storage.buckets (id, name, public)
  values ('branding', 'branding', true)
  on conflict (id) do nothing;

-- Public read
create policy "Branding files are public"
  on storage.objects for select
  using (bucket_id = 'branding');

-- Org members owner/admin can manage org/{org_id}/...
create policy "Org admins can upload branding"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = 'org'
    and has_org_role(((storage.foldername(name))[2])::uuid, auth.uid(), array['owner'::org_role,'admin'::org_role])
  );

create policy "Org admins can update branding"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = 'org'
    and has_org_role(((storage.foldername(name))[2])::uuid, auth.uid(), array['owner'::org_role,'admin'::org_role])
  );

create policy "Org admins can delete branding"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = 'org'
    and has_org_role(((storage.foldername(name))[2])::uuid, auth.uid(), array['owner'::org_role,'admin'::org_role])
  );

-- Users can manage their own avatar at user/{user_id}/...
create policy "Users can upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users can update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users can delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = 'user'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
