ALTER TABLE public.tabletops ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS tabletops_owner_idx ON public.tabletops (owner);