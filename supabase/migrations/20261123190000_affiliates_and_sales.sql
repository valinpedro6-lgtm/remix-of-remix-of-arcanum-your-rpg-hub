create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  discount_percent numeric(5,2) not null default 0,
  commission_percent numeric(5,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint affiliates_code_format check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,32}$'),
  constraint affiliates_discount_range check (discount_percent >= 0 and discount_percent <= 100),
  constraint affiliates_commission_range check (commission_percent >= 0 and commission_percent <= 100)
);
create index if not exists affiliates_active_code_idx on public.affiliates (active, code);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  plan text not null,
  gross_amount_cents integer not null,
  discount_percent numeric(5,2) not null default 0,
  discount_amount_cents integer not null default 0,
  net_amount_cents integer not null,
  affiliate_id uuid references public.affiliates(id) on delete set null,
  affiliate_code text not null default '',
  commission_percent numeric(5,2) not null default 0,
  commission_amount_cents integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  constraint sales_plan check (plan in ('vitalicio', 'mensal')),
  constraint sales_amounts_positive check (gross_amount_cents > 0 and net_amount_cents > 0),
  constraint sales_status check (status in ('pending', 'approved', 'rejected'))
);
create index if not exists sales_created_at_idx on public.sales (created_at desc);
create index if not exists sales_status_idx on public.sales (status);
grant all on public.affiliates to service_role;
grant all on public.sales to service_role;
alter table public.affiliates enable row level security;
alter table public.sales enable row level security;
