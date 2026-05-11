-- Subscriptions system
DO $$ BEGIN
  CREATE TYPE public.plan_type AS ENUM ('starter','pro','business','enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trial','pending','active','past_due','suspended','canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan public.plan_type NOT NULL DEFAULT 'starter',
  status public.subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  mrr_cents integer NOT NULL DEFAULT 0,
  notes text,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_plan_idx ON public.subscriptions(plan);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view own subscription" ON public.subscriptions;
CREATE POLICY "Members view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "Super admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Super admins manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'super_admin'))
  WITH CHECK (has_role(auth.uid(),'super_admin'));

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create trial subscription when an organization is created
CREATE OR REPLACE FUNCTION public.handle_new_org_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (organization_id, plan, status, trial_ends_at, current_period_end)
  VALUES (NEW.id, 'starter', 'trial', now() + interval '14 days', now() + interval '14 days')
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_org_subscription ON public.organizations;
CREATE TRIGGER trg_new_org_subscription
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_org_subscription();

-- Backfill subscriptions for existing organizations
INSERT INTO public.subscriptions (organization_id, plan, status, trial_ends_at, current_period_end)
SELECT o.id, COALESCE(NULLIF(o.plan,'')::public.plan_type, 'starter'), 'trial',
       now() + interval '14 days', now() + interval '14 days'
FROM public.organizations o
LEFT JOIN public.subscriptions s ON s.organization_id = o.id
WHERE s.id IS NULL
ON CONFLICT (organization_id) DO NOTHING;

-- Allow super admins to view all profiles for the admin panel
DROP POLICY IF EXISTS "Super admins view all profiles" ON public.profiles;
CREATE POLICY "Super admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin'));