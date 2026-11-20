-- Esquema de importação Arcanum. Sem dados/seed e sem políticas RLS permissivas.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'character',
  name text DEFAULT 'Sem nome',
  subtitle text DEFAULT '',
  origin text DEFAULT '',
  age text DEFAULT '',
  occupation text DEFAULT '',
  profile text DEFAULT '',
  background text DEFAULT '',
  image_url text DEFAULT '',
  accent text NOT NULL DEFAULT '#a78bfa',
  style jsonb NOT NULL DEFAULT '{}'::jsonb,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  skills jsonb NOT NULL DEFAULT '{}'::jsonb,
  resources jsonb NOT NULL DEFAULT '{}'::jsonb,
  abilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  in_list boolean NOT NULL DEFAULT false,
  share_id text NOT NULL DEFAULT encode(gen_random_bytes(9), 'hex'),
  edit_pin text,
  owner text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_roll jsonb,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  xp_goal integer NOT NULL DEFAULT 100,
  initiative integer NOT NULL DEFAULT 0,
  CONSTRAINT sheets_share_id_key UNIQUE (share_id)
);
CREATE INDEX IF NOT EXISTS sheets_kind_idx ON public.sheets (kind);
CREATE INDEX IF NOT EXISTS sheets_owner_idx ON public.sheets (owner);

CREATE TABLE IF NOT EXISTS public.tabletops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text DEFAULT 'Novo mapa',
  map_url text DEFAULT '',
  tokens jsonb NOT NULL DEFAULT '[]'::jsonb,
  grid boolean NOT NULL DEFAULT false,
  fog jsonb NOT NULL DEFAULT '[]'::jsonb,
  share_id text NOT NULL DEFAULT encode(gen_random_bytes(9), 'hex'),
  zoom double precision NOT NULL DEFAULT 1,
  last_roll jsonb,
  owner text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  turn_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  active_turn integer NOT NULL DEFAULT 0,
  round integer NOT NULL DEFAULT 1,
  vision_mode text NOT NULL DEFAULT 'all',
  camera jsonb NOT NULL DEFAULT '{"x":0.5,"y":0.5}'::jsonb,
  CONSTRAINT tabletops_share_id_key UNIQUE (share_id),
  CONSTRAINT tabletops_vision_mode_check CHECK (vision_mode IN ('all', 'token'))
);
CREATE INDEX IF NOT EXISTS tabletops_owner_idx ON public.tabletops (owner);

CREATE TABLE IF NOT EXISTS public.sheets_history (
  history_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  row_id uuid NOT NULL,
  owner text,
  operation text NOT NULL CHECK (operation IN ('baseline', 'INSERT', 'UPDATE', 'DELETE')),
  snapshot jsonb NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sheets_history_row_idx ON public.sheets_history (row_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS sheets_history_owner_idx ON public.sheets_history (owner, saved_at DESC);

CREATE TABLE IF NOT EXISTS public.tabletops_history (
  history_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  row_id uuid NOT NULL,
  owner text,
  operation text NOT NULL CHECK (operation IN ('baseline', 'INSERT', 'UPDATE', 'DELETE')),
  snapshot jsonb NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tabletops_history_row_idx ON public.tabletops_history (row_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS tabletops_history_owner_idx ON public.tabletops_history (owner, saved_at DESC);

CREATE TABLE IF NOT EXISTS public.access_gate (
  id integer PRIMARY KEY DEFAULT 1,
  master_password text NOT NULL,
  current_code text NOT NULL,
  code_updated_at timestamptz NOT NULL DEFAULT now(),
  code_max_uses integer NOT NULL DEFAULT 1,
  code_uses_left integer NOT NULL DEFAULT 1,
  test_code text,
  test_code_expires_at timestamptz,
  CONSTRAINT access_gate_single_row CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS public.access_attempts (
  ip text PRIMARY KEY,
  fails integer NOT NULL DEFAULT 0,
  strikes integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.access_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  label text NOT NULL DEFAULT '',
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS access_sessions_device_key ON public.access_sessions (device_id);
CREATE INDEX IF NOT EXISTS access_sessions_last_seen_idx ON public.access_sessions (last_seen);

-- Acesso permanece fechado até ser configurado explicitamente no destino.
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabletops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheets_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabletops_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_gate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_sessions ENABLE ROW LEVEL SECURITY;
