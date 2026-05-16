-- =====================================================================
-- LINKU SUMMIT — Migración 0009
-- Cupones: policies de admin + tabla coupon_redemptions (tracking)
-- =====================================================================

-- ---------------------------------------------------------------------
-- POLICIES de admin sobre coupons (la tabla ya existe desde 0003)
-- ---------------------------------------------------------------------
drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Admins manage coupons"
  on public.coupons for all
  using (public.is_admin())
  with check (public.is_admin());

-- updated_at trigger para coupons (no estaba en 0003)
do $$
begin
  if not exists (select 1 from pg_attribute
    where attrelid = 'public.coupons'::regclass
      and attname = 'updated_at') then
    alter table public.coupons
      add column updated_at timestamptz not null default now();
  end if;
end$$;

drop trigger if exists coupons_updated_at on public.coupons;
create trigger coupons_updated_at
  before update on public.coupons
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------
-- COUPON_REDEMPTIONS — tracking de cada uso de cupón
-- ---------------------------------------------------------------------
create table if not exists public.coupon_redemptions (
  id uuid primary key default uuid_generate_v4(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Snapshot del código al momento del uso (por si después se renombra)
  code_snapshot text not null,
  discount_cop integer not null check (discount_cop >= 0),
  created_at timestamptz not null default now(),
  -- Una orden solo puede redimir un cupón (atómico contra doble webhook)
  unique (order_id)
);

create index if not exists coupon_redemptions_coupon_idx
  on public.coupon_redemptions(coupon_id);
create index if not exists coupon_redemptions_user_idx
  on public.coupon_redemptions(user_id);
create index if not exists coupon_redemptions_created_at_idx
  on public.coupon_redemptions(created_at desc);

alter table public.coupon_redemptions enable row level security;

drop policy if exists "Users view own redemptions" on public.coupon_redemptions;
create policy "Users view own redemptions"
  on public.coupon_redemptions for select
  using (auth.uid() = user_id);

drop policy if exists "Admins view all redemptions" on public.coupon_redemptions;
create policy "Admins view all redemptions"
  on public.coupon_redemptions for select
  using (public.is_admin());

-- INSERT lo hace el webhook con service role (bypasa RLS).
-- No exponemos INSERT a anon ni a authenticated normales.

-- ---------------------------------------------------------------------
-- RPC atómico para incrementar current_uses (anti race conditions)
-- ---------------------------------------------------------------------
create or replace function public.increment_coupon_uses(coupon_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.coupons
  set current_uses = current_uses + 1
  where id = coupon_id;
$$;
