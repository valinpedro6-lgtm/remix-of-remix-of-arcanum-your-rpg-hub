ALTER TABLE public.tabletops
  ADD COLUMN IF NOT EXISTS turn_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS active_turn integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS round integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS vision_mode text NOT NULL DEFAULT 'all';

ALTER TABLE public.tabletops
  DROP CONSTRAINT IF EXISTS tabletops_vision_mode_check;
ALTER TABLE public.tabletops
  ADD CONSTRAINT tabletops_vision_mode_check CHECK (vision_mode IN ('all', 'token'));
