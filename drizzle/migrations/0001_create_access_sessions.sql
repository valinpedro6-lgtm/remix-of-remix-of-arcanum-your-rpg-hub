CREATE TABLE public.access_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  label text NOT NULL DEFAULT '',
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX access_sessions_device_key ON public.access_sessions (device_id);
CREATE INDEX access_sessions_last_seen_idx ON public.access_sessions (last_seen);

GRANT ALL ON public.access_sessions TO service_role;

ALTER TABLE public.access_sessions ENABLE ROW LEVEL SECURITY;