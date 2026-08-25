CREATE TABLE public.access_attempts (
  ip text PRIMARY KEY,
  fails integer NOT NULL DEFAULT 0,
  strikes integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.access_attempts TO service_role;

ALTER TABLE public.access_attempts ENABLE ROW LEVEL SECURITY;