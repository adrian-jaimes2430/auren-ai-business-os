
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.channels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_autoreply boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS conversations_channel_id_idx ON public.conversations(channel_id);

ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE INDEX IF NOT EXISTS contacts_external_id_idx ON public.contacts(organization_id, external_id);
