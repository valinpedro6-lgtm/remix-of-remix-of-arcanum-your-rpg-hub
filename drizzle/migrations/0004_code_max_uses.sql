ALTER TABLE public.access_gate ADD COLUMN IF NOT EXISTS code_max_uses integer NOT NULL DEFAULT 1;
ALTER TABLE public.access_gate ADD COLUMN IF NOT EXISTS code_uses_left integer NOT NULL DEFAULT 1;