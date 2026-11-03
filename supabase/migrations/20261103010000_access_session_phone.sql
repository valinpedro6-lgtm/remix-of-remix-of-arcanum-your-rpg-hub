alter table public.access_sessions
  add column if not exists phone text;

create index if not exists access_sessions_phone_idx on public.access_sessions (phone);
