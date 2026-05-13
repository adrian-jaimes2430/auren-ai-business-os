-- Marca de organización de soporte interno
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_support_org boolean NOT NULL DEFAULT false;

-- Helper: ¿pertenece a alguna org marcada como soporte?
CREATE OR REPLACE FUNCTION public.is_support_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = _user_id AND o.is_support_org = true
  )
$$;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM ('open','in_progress','waiting_user','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_priority AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabla principal
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  created_by uuid NOT NULL,
  assigned_to uuid,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'normal',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org_status ON public.support_tickets(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to, status);

CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Lectura: miembros del org, soporte, super admin
CREATE POLICY "view tickets" ON public.support_tickets FOR SELECT TO authenticated
USING (
  is_org_member(organization_id, auth.uid())
  OR is_support_staff(auth.uid())
  OR has_role(auth.uid(), 'super_admin')
);

-- Inserción: cualquier miembro del org
CREATE POLICY "create tickets" ON public.support_tickets FOR INSERT TO authenticated
WITH CHECK (
  is_org_member(organization_id, auth.uid()) AND created_by = auth.uid()
);

-- Update: creador, soporte, super admin
CREATE POLICY "update tickets" ON public.support_tickets FOR UPDATE TO authenticated
USING (
  created_by = auth.uid()
  OR is_support_staff(auth.uid())
  OR has_role(auth.uid(), 'super_admin')
);

-- Mensajes
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON public.support_ticket_messages(ticket_id, created_at);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Lectura mensajes
CREATE POLICY "view ticket messages" ON public.support_ticket_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND (
        is_org_member(t.organization_id, auth.uid())
        OR is_support_staff(auth.uid())
        OR has_role(auth.uid(), 'super_admin')
      )
  )
  AND (
    NOT is_internal
    OR is_support_staff(auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  )
);

-- Inserción mensajes
CREATE POLICY "create ticket messages" ON public.support_ticket_messages FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id
      AND (
        is_org_member(t.organization_id, auth.uid())
        OR is_support_staff(auth.uid())
        OR has_role(auth.uid(), 'super_admin')
      )
  )
  AND (
    NOT is_internal
    OR is_support_staff(auth.uid())
    OR has_role(auth.uid(), 'super_admin')
  )
);

-- Permite a soporte/super admin ver miembros de la org soporte (para dropdown de asignación)
CREATE POLICY "support staff view all members" ON public.organization_members FOR SELECT TO authenticated
USING (is_support_staff(auth.uid()) OR has_role(auth.uid(), 'super_admin'));