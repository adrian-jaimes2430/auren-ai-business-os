ALTER TABLE public.channels
  ADD COLUMN IF NOT EXISTS meta_ad_account_id text,
  ADD COLUMN IF NOT EXISTS meta_page_id text,
  ADD COLUMN IF NOT EXISTS meta_ig_user_id text;