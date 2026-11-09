-- Schema required by the access-gate Edge Function.
create table if not exists public.access_gate (
  id integer primary key default 1,
  master_password text not null,
  current_code text not null,
  code_updated_at timestamptz not null default now(),
  code_max_uses integer not null default 1,
  code_uses_left integer not null default 1,
  test_code text,
  test_code_expires_at timestamptz,
  constraint access_gate_single_row check (id = 1)
);

alter table public.access_gate add column if not exists code_max_uses integer not null default 1;
alter table public.access_gate add column if not exists code_uses_left integer not null default 1;
alter table public.access_gate add column if not exists test_code text;
alter table public.access_gate add column if not exists test_code_expires_at timestamptz;

insert into public.access_gate (id, master_password, current_code, code_max_uses, code_uses_left)
values (1, '28208778', '000000', 1, 1)
on conflict (id) do nothing;

create table if not exists public.access_attempts (
  ip text primary key,
  fails integer not null default 0,
  strikes integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.access_sessions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  label text not null default '',
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create unique index if not exists access_sessions_device_key on public.access_sessions (device_id);
create index if not exists access_sessions_last_seen_idx on public.access_sessions (last_seen);

grant all on public.access_gate to service_role;
grant all on public.access_attempts to service_role;
grant all on public.access_sessions to service_role;

alter table public.access_gate enable row level security;
alter table public.access_attempts enable row level security;
alter table public.access_sessions enable row level security;
