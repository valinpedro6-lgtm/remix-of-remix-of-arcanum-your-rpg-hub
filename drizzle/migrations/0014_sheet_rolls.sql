ALTER TABLE public.sheets
  ADD COLUMN IF NOT EXISTS last_roll jsonb;
