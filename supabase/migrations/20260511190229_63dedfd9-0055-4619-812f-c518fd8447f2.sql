CREATE OR REPLACE FUNCTION public.create_workspace_with_defaults(_name text)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_name text;
  base_slug text;
  final_slug text;
  org_row public.organizations%ROWTYPE;
  pipeline_row public.pipelines%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  clean_name := nullif(trim(_name), '');
  IF clean_name IS NULL OR char_length(clean_name) < 2 THEN
    RAISE EXCEPTION 'El nombre de la organización debe tener al menos 2 caracteres';
  END IF;

  base_slug := trim(both '-' from regexp_replace(lower(clean_name), '[^a-z0-9]+', '-', 'g'));
  IF base_slug IS NULL OR base_slug = '' THEN
    base_slug := 'workspace';
  END IF;
  final_slug := left(base_slug, 40) || '-' || lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  INSERT INTO public.organizations (name, slug, owner_id, plan)
  VALUES (clean_name, final_slug, auth.uid(), 'starter')
  RETURNING * INTO org_row;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_row.id, auth.uid(), 'owner')
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner';

  INSERT INTO public.subscriptions (organization_id, plan, status, trial_ends_at, current_period_end)
  VALUES (org_row.id, 'starter', 'trial', now() + interval '14 days', now() + interval '14 days')
  ON CONFLICT (organization_id) DO NOTHING;

  INSERT INTO public.pipelines (organization_id, name, is_default)
  VALUES (org_row.id, 'Pipeline principal', true)
  RETURNING * INTO pipeline_row;

  INSERT INTO public.pipeline_stages (pipeline_id, organization_id, name, position, color, is_won, is_lost)
  VALUES
    (pipeline_row.id, org_row.id, 'Nuevo lead', 0, '#60a5fa', false, false),
    (pipeline_row.id, org_row.id, 'Contactado', 1, '#a78bfa', false, false),
    (pipeline_row.id, org_row.id, 'Calificado', 2, '#f59e0b', false, false),
    (pipeline_row.id, org_row.id, 'Propuesta', 3, '#10b981', false, false),
    (pipeline_row.id, org_row.id, 'Ganado', 4, '#22c55e', true, false),
    (pipeline_row.id, org_row.id, 'Perdido', 5, '#ef4444', false, true);

  RETURN org_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_workspace_with_defaults(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_workspace_with_defaults(text) TO authenticated;