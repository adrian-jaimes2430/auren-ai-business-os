DROP TRIGGER IF EXISTS trg_new_organization ON public.organizations;
CREATE TRIGGER trg_new_organization
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();

DROP TRIGGER IF EXISTS trg_new_org_subscription ON public.organizations;
CREATE TRIGGER trg_new_org_subscription
AFTER INSERT ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.handle_new_org_subscription();

DROP TRIGGER IF EXISTS trg_orgs_updated_at ON public.organizations;
CREATE TRIGGER trg_orgs_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_pipelines_updated_at ON public.pipelines;
CREATE TRIGGER trg_pipelines_updated_at
BEFORE UPDATE ON public.pipelines
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_deals_updated_at ON public.deals;
CREATE TRIGGER trg_deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT o.id, o.owner_id, 'owner'::public.org_role
FROM public.organizations o
LEFT JOIN public.organization_members om
  ON om.organization_id = o.id AND om.user_id = o.owner_id
WHERE om.id IS NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

INSERT INTO public.subscriptions (organization_id, plan, status, trial_ends_at, current_period_end)
SELECT o.id,
       CASE WHEN o.plan IN ('starter','pro','business','enterprise') THEN o.plan::public.plan_type ELSE 'starter'::public.plan_type END,
       'trial'::public.subscription_status,
       now() + interval '14 days',
       now() + interval '14 days'
FROM public.organizations o
LEFT JOIN public.subscriptions s ON s.organization_id = o.id
WHERE s.id IS NULL
ON CONFLICT (organization_id) DO NOTHING;