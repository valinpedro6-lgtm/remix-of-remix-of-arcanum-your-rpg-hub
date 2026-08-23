CREATE TABLE public.access_gate (
  id integer PRIMARY KEY DEFAULT 1,
  master_password text NOT NULL,
  current_code text NOT NULL,
  code_updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT access_gate_single_row CHECK (id = 1)
);

GRANT ALL ON public.access_gate TO service_role;

ALTER TABLE public.access_gate ENABLE ROW LEVEL SECURITY;

INSERT INTO public.access_gate (id, master_password, current_code)
VALUES (1, '28208778', '000000');