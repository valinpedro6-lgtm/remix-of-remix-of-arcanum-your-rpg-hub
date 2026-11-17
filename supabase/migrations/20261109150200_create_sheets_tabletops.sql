create extension if not exists pgcrypto;

create table if not exists public.sheets (
  id uuid primary key default gen_random_uuid(),
  owner text,
  kind text not null default 'character',
  style jsonb not null default '{}'::jsonb,
  name text not null default 'Sem nome',
  subtitle text not null default '',
  origin text not null default '',
  image_url text not null default '',
  accent text not null default '#a78bfa',
  attributes jsonb not null default '{}'::jsonb,
  skills jsonb not null default '{}'::jsonb,
  resources jsonb not null default '{}'::jsonb,
  abilities jsonb not null default '[]'::jsonb,
  notes text not null default '',
  in_list boolean not null default false,
  share_id text not null unique default encode(gen_random_bytes(12), 'hex'),
  edit_pin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tabletops (
  id uuid primary key default gen_random_uuid(),
  owner text,
  name text not null default 'Novo mapa',
  map_url text not null default '',
  tokens jsonb not null default '[]'::jsonb,
  grid boolean not null default true,
  fog jsonb not null default '{}'::jsonb,
  zoom numeric not null default 1,
  view jsonb not null default '{"x":0,"y":0}'::jsonb,
  active boolean not null default true,
  last_roll jsonb,
  share_id text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant all on public.sheets to service_role;
grant all on public.tabletops to service_role;

alter table public.sheets enable row level security;
alter table public.tabletops enable row level security;
