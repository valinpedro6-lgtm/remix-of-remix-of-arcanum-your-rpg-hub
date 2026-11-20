CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sheets_touch_updated_at ON public.sheets;
CREATE TRIGGER sheets_touch_updated_at
BEFORE UPDATE ON public.sheets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS tabletops_touch_updated_at ON public.tabletops;
CREATE TRIGGER tabletops_touch_updated_at
BEFORE UPDATE ON public.tabletops
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.backup_arcanum_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'sheets' THEN
    IF TG_OP = 'DELETE' THEN
      INSERT INTO public.sheets_history (row_id, owner, operation, snapshot)
      VALUES (OLD.id, OLD.owner, TG_OP, to_jsonb(OLD));
      RETURN OLD;
    END IF;
    INSERT INTO public.sheets_history (row_id, owner, operation, snapshot)
    VALUES (NEW.id, NEW.owner, TG_OP, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_TABLE_NAME = 'tabletops' THEN
    IF TG_OP = 'DELETE' THEN
      INSERT INTO public.tabletops_history (row_id, owner, operation, snapshot)
      VALUES (OLD.id, OLD.owner, TG_OP, to_jsonb(OLD));
      RETURN OLD;
    END IF;
    INSERT INTO public.tabletops_history (row_id, owner, operation, snapshot)
    VALUES (NEW.id, NEW.owner, TG_OP, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sheets_backup_history ON public.sheets;
CREATE TRIGGER sheets_backup_history
AFTER INSERT OR UPDATE OR DELETE ON public.sheets
FOR EACH ROW EXECUTE FUNCTION public.backup_arcanum_row();

DROP TRIGGER IF EXISTS tabletops_backup_history ON public.tabletops;
CREATE TRIGGER tabletops_backup_history
AFTER INSERT OR UPDATE OR DELETE ON public.tabletops
FOR EACH ROW EXECUTE FUNCTION public.backup_arcanum_row();

DO $$
DECLARE
  seq_name text;
  highest_id bigint;
BEGIN
  SELECT pg_get_serial_sequence('public.sheets_history', 'history_id'), max(history_id)
    INTO seq_name, highest_id
    FROM public.sheets_history;
  IF seq_name IS NOT NULL THEN
    PERFORM setval(seq_name, COALESCE(highest_id, 1), highest_id IS NOT NULL);
  END IF;

  SELECT pg_get_serial_sequence('public.tabletops_history', 'history_id'), max(history_id)
    INTO seq_name, highest_id
    FROM public.tabletops_history;
  IF seq_name IS NOT NULL THEN
    PERFORM setval(seq_name, COALESCE(highest_id, 1), highest_id IS NOT NULL);
  END IF;
END;
$$;
