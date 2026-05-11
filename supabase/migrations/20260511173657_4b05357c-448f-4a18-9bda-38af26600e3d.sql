
-- Knowledge base for AI-grounded responses
CREATE TABLE public.knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  use_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_knowledge_org ON public.knowledge_articles(organization_id) WHERE is_active = true;
CREATE INDEX idx_knowledge_search ON public.knowledge_articles USING gin (to_tsvector('simple', title || ' ' || content));

ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view knowledge"
  ON public.knowledge_articles FOR SELECT TO authenticated
  USING (is_org_member(organization_id, auth.uid()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Owners/admins/supervisors manage knowledge"
  ON public.knowledge_articles FOR ALL TO authenticated
  USING (has_org_role(organization_id, auth.uid(), ARRAY['owner'::org_role,'admin'::org_role,'supervisor'::org_role]) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_org_role(organization_id, auth.uid(), ARRAY['owner'::org_role,'admin'::org_role,'supervisor'::org_role]) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON public.knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Allow org members to view branding objects (so signed URLs / listing work even though bucket is public)
CREATE POLICY "Public read branding"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'branding');
