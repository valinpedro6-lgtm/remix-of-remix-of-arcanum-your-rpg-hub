CREATE TABLE IF NOT EXISTS public.library_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_url text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.library_documents ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.library_documents TO anon, authenticated;
GRANT ALL ON public.library_documents TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('arcanum-library', 'arcanum-library', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can read Arcanum library files" ON storage.objects;
CREATE POLICY "Public can read Arcanum library files"
ON storage.objects FOR SELECT
USING (bucket_id = 'arcanum-library');
