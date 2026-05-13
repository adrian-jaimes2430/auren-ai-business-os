
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (
  id uuid,
  email text,
  role org_role,
  status text,
  expires_at timestamptz,
  organization_id uuid,
  organization_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.email, i.role, i.status, i.expires_at, i.organization_id, o.name
  FROM public.organization_invitations i
  LEFT JOIN public.organizations o ON o.id = i.organization_id
  WHERE i.token = _token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;
