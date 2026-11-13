ALTER TABLE public.tabletops
  ADD COLUMN IF NOT EXISTS camera jsonb NOT NULL DEFAULT '{"x":0.5,"y":0.5}'::jsonb;

UPDATE public.tabletops
SET camera = '{"x":0.5,"y":0.5}'::jsonb
WHERE camera IS NULL;
