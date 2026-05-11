
CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel public.channel_type NOT NULL,
  category text,
  subject text,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_msg_templates_org ON public.message_templates(organization_id);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view templates" ON public.message_templates
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owners/admins/supervisors manage templates" ON public.message_templates
  FOR ALL TO authenticated
  USING (has_org_role(organization_id, auth.uid(), ARRAY['owner','admin','supervisor']::org_role[]) OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_org_role(organization_id, auth.uid(), ARRAY['owner','admin','supervisor']::org_role[]) OR has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_msg_templates_updated_at BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  channel public.channel_type NOT NULL,
  channel_id uuid REFERENCES public.channels(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  subject text,
  body text NOT NULL,
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  total_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.campaigns(organization_id);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owners/admins/supervisors manage campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (has_org_role(organization_id, auth.uid(), ARRAY['owner','admin','supervisor']::org_role[]) OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_org_role(organization_id, auth.uid(), ARRAY['owner','admin','supervisor']::org_role[]) OR has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_camp_recip_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_recip_org ON public.campaign_recipients(organization_id);
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view recipients" ON public.campaign_recipients
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owners/admins/supervisors manage recipients" ON public.campaign_recipients
  FOR ALL TO authenticated
  USING (has_org_role(organization_id, auth.uid(), ARRAY['owner','admin','supervisor']::org_role[]) OR has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_org_role(organization_id, auth.uid(), ARRAY['owner','admin','supervisor']::org_role[]) OR has_role(auth.uid(), 'super_admin'));
