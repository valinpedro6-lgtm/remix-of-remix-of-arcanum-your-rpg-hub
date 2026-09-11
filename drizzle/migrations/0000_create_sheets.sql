CREATE TABLE public.sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'player',
  name text NOT NULL DEFAULT 'Sem nome',
  subtitle text NOT NULL DEFAULT '',
  origin text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  accent text NOT NULL DEFAULT 'red',
  attributes jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  abilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  in_list boolean NOT NULL DEFAULT false,
  share_id text NOT NULL DEFAULT encode(gen_random_bytes(9), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sheets_share_id_key ON public.sheets (share_id);
CREATE INDEX sheets_kind_idx ON public.sheets (kind);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sheets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sheets TO authenticated;
GRANT ALL ON public.sheets TO service_role;

ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sheets_select_all" ON public.sheets FOR SELECT USING (true);
CREATE POLICY "sheets_insert_all" ON public.sheets FOR INSERT WITH CHECK (true);
CREATE POLICY "sheets_update_all" ON public.sheets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sheets_delete_all" ON public.sheets FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER sheets_touch_updated_at
BEFORE UPDATE ON public.sheets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();