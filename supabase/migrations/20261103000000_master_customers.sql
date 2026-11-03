ALTER TABLE public.access_sessions
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS billing_start date,
  ADD COLUMN IF NOT EXISTS billing_until date,
  ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_code boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS access_sessions_billing_until_idx ON public.access_sessions (billing_until);

CREATE TABLE IF NOT EXISTS public.access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  event_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS access_events_device_idx ON public.access_events (device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS access_events_created_idx ON public.access_events (created_at DESC);
GRANT ALL ON public.access_events TO service_role;
ALTER TABLE public.access_events ENABLE ROW LEVEL SECURITY;
