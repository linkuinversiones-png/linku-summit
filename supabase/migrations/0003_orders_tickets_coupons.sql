-- =====================================================================
-- LINKU SUMMIT — Migración 0003
-- Crea: orders, tickets_issued, coupons + RLS + seed de cupones demo
-- Depende de: 0001_init.sql (handle_updated_at trigger function)
-- =====================================================================

-- =====================================================================
-- ORDERS — registro de cada compra (paga o no)
-- =====================================================================
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete restrict,
  ticket_tier text not null check (ticket_tier in ('early-investor','smart-investor')),
  subtotal_cop integer not null check (subtotal_cop > 0),
  discount_cop integer not null default 0 check (discount_cop >= 0),
  total_cop integer not null check (total_cop >= 0),
  coupon_code text,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','expired')),
  wompi_transaction_id text,
  wompi_reference text not null unique,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

alter table public.orders enable row level security;

drop policy if exists "Users view own orders" on public.orders;
create policy "Users view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- =====================================================================
-- TICKETS_ISSUED — cada boleta generada con QR único
-- =====================================================================
create table if not exists public.tickets_issued (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  qr_code text not null unique,
  ticket_tier text not null,
  attendee_name text,
  attendee_email text,
  status text not null default 'active' check (status in ('active','used','cancelled','transferred')),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tickets_issued_user_id_idx on public.tickets_issued(user_id);
create index if not exists tickets_issued_qr_idx on public.tickets_issued(qr_code);
create index if not exists tickets_issued_order_id_idx on public.tickets_issued(order_id);

alter table public.tickets_issued enable row level security;

drop policy if exists "Users view own tickets" on public.tickets_issued;
create policy "Users view own tickets"
  on public.tickets_issued for select
  using (auth.uid() = user_id);

-- =====================================================================
-- COUPONS — códigos de descuento
-- =====================================================================
create table if not exists public.coupons (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value integer not null check (discount_value > 0),
  max_uses integer,
  current_uses integer not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  applies_to_tiers text[],
  created_at timestamptz not null default now()
);

create index if not exists coupons_code_idx on public.coupons(code);
create index if not exists coupons_active_idx on public.coupons(active);

alter table public.coupons enable row level security;

drop policy if exists "Public can validate active coupons" on public.coupons;
create policy "Public can validate active coupons"
  on public.coupons for select
  using (active = true);

-- =====================================================================
-- Seed: cupones de ejemplo
-- =====================================================================
insert into public.coupons (code, description, discount_type, discount_value, max_uses, expires_at)
values
  ('EARLYBIRD2026', 'Early bird — primer cupo, descuento 20%', 'percent', 20, 50, '2026-07-31'),
  ('COMUNIDAD', 'Comunidad LinkU — descuento 15%', 'percent', 15, null, '2026-10-15')
on conflict (code) do nothing;
