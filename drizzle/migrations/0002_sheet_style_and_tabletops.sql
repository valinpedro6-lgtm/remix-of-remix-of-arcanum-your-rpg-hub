ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS style jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE public.tabletops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Novo mapa',
  map_url text NOT NULL DEFAULT '',
  tokens jsonb NOT NULL DEFAULT '[]'::jsonb,
  grid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tabletops TO anon, authenticated;
GRANT ALL ON public.tabletops TO service_role;
ALTER TABLE public.tabletops ENABLE ROW LEVEL SECURITY;
CREATE POLICY tabletops_all ON public.tabletops FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER tabletops_touch_updated_at BEFORE UPDATE ON public.tabletops FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();