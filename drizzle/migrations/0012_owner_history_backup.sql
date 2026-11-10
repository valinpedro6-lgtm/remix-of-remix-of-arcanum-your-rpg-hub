CREATE TABLE IF NOT EXISTS public.sheets_history (
  history_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  row_id uuid NOT NULL,
  owner text,
  operation text NOT NULL CHECK (operation IN ('baseline', 'INSERT', 'UPDATE', 'DELETE')),
  snapshot jsonb NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sheets_history_row_idx ON public.sheets_history(row_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS sheets_history_owner_idx ON public.sheets_history(owner, saved_at DESC);

CREATE TABLE IF NOT EXISTS public.tabletops_history (
  history_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  row_id uuid NOT NULL,
  owner text,
  operation text NOT NULL CHECK (operation IN ('baseline', 'INSERT', 'UPDATE', 'DELETE')),
  snapshot jsonb NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tabletops_history_row_idx ON public.tabletops_history(row_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS tabletops_history_owner_idx ON public.tabletops_history(owner, saved_at DESC);

CREATE OR REPLACE FUNCTION public.backup_arcanum_row()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'sheets' THEN
    IF TG_OP = 'DELETE' THEN
      INSERT INTO public.sheets_history(row_id, owner, operation, snapshot) VALUES (OLD.id, OLD.owner, TG_OP, to_jsonb(OLD));
      RETURN OLD;
    ELSE
      INSERT INTO public.sheets_history(row_id, owner, operation, snapshot) VALUES (NEW.id, NEW.owner, TG_OP, to_jsonb(NEW));
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'tabletops' THEN
    IF TG_OP = 'DELETE' THEN
      INSERT INTO public.tabletops_history(row_id, owner, operation, snapshot) VALUES (OLD.id, OLD.owner, TG_OP, to_jsonb(OLD));
      RETURN OLD;
    ELSE
      INSERT INTO public.tabletops_history(row_id, owner, operation, snapshot) VALUES (NEW.id, NEW.owner, TG_OP, to_jsonb(NEW));
      RETURN NEW;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sheets_backup_history ON public.sheets;
CREATE TRIGGER sheets_backup_history AFTER INSERT OR UPDATE OR DELETE ON public.sheets FOR EACH ROW EXECUTE FUNCTION public.backup_arcanum_row();
DROP TRIGGER IF EXISTS tabletops_backup_history ON public.tabletops;
CREATE TRIGGER tabletops_backup_history AFTER INSERT OR UPDATE OR DELETE ON public.tabletops FOR EACH ROW EXECUTE FUNCTION public.backup_arcanum_row();

INSERT INTO public.sheets_history(row_id, owner, operation, snapshot)
SELECT id, owner, 'baseline', to_jsonb(s) FROM public.sheets s
WHERE NOT EXISTS (SELECT 1 FROM public.sheets_history h WHERE h.row_id = s.id) LIMIT 1000;
INSERT INTO public.tabletops_history(row_id, owner, operation, snapshot)
SELECT id, owner, 'baseline', to_jsonb(t) FROM public.tabletops t
WHERE NOT EXISTS (SELECT 1 FROM public.tabletops_history h WHERE h.row_id = t.id) LIMIT 1000;

ALTER TABLE public.sheets_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabletops_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sheets_history FROM anon, authenticated;
REVOKE ALL ON public.tabletops_history FROM anon, authenticated;
GRANT ALL ON public.sheets_history TO service_role;
GRANT ALL ON public.tabletops_history TO service_role;
