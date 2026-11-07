ALTER TABLE public.tabletops
  ADD COLUMN IF NOT EXISTS camera_x double precision NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS camera_y double precision NOT NULL DEFAULT 50;
