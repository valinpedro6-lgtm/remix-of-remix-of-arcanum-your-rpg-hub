CREATE TABLE IF NOT EXISTS public.master_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS master_library_created_idx ON public.master_library(created_at DESC);

ALTER TABLE public.master_library ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.master_library FROM anon, authenticated;
GRANT ALL ON public.master_library TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('arcanum-library', 'arcanum-library', false)
ON CONFLICT (id) DO UPDATE SET public = false;
