
ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_error text,
  ADD COLUMN IF NOT EXISTS meta_app_id text,
  ADD COLUMN IF NOT EXISTS meta_business_id text,
  ADD COLUMN IF NOT EXISTS meta_waba_id text;

ALTER TABLE public.channels
  DROP CONSTRAINT IF EXISTS channels_verification_status_check;
ALTER TABLE public.channels
  ADD CONSTRAINT channels_verification_status_check
  CHECK (verification_status IN ('unverified','verifying','verified','failed'));
