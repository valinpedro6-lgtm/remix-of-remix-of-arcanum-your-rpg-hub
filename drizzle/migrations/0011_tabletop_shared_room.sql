ALTER TABLE public.tabletops
  ADD COLUMN IF NOT EXISTS room_id text,
  ADD COLUMN IF NOT EXISTS is_current boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_enabled boolean NOT NULL DEFAULT true;

UPDATE public.tabletops
SET room_id = COALESCE(room_id, share_id)
WHERE room_id IS NULL;

CREATE INDEX IF NOT EXISTS tabletops_room_idx ON public.tabletops (room_id);
