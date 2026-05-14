-- =====================================================================
-- LINKU SUMMIT — Migración 0004
-- Helpers para verificación de rol admin:
--   - Función public.is_admin() reutilizable en RLS policies
--   - Políticas RLS que permiten a admins leer/operar en orders, tickets, profiles
-- Depende de: 0001_init.sql (tabla profiles), 0003 (orders, tickets_issued, coupons)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Función: is_admin()
-- Retorna true si el usuario autenticado tiene profiles.role = 'admin'.
-- SECURITY DEFINER para que pueda leer profiles aunque RLS bloquee.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role = 'admin'
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- ---------------------------------------------------------------------
-- RLS adicional: admins pueden VER toda la tabla profiles
-- (la política original "Anyone can view profiles" ya lo permite,
--  pero la dejamos explícita por si en el futuro se restringe lectura)
-- ---------------------------------------------------------------------
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- RLS: admins pueden VER y MODIFICAR todas las orders
-- ---------------------------------------------------------------------
drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- RLS: admins pueden VER y MODIFICAR todos los tickets emitidos
-- (necesario para portería, gestión de cancelaciones, etc.)
-- ---------------------------------------------------------------------
drop policy if exists "Admins can view all tickets" on public.tickets_issued;
create policy "Admins can view all tickets"
  on public.tickets_issued for select
  using (public.is_admin());

drop policy if exists "Admins can update tickets" on public.tickets_issued;
create policy "Admins can update tickets"
  on public.tickets_issued for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- RLS: admins pueden gestionar cupones
-- ---------------------------------------------------------------------
drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Admins can manage coupons"
  on public.coupons for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- PROMOVER PRIMER ADMIN
-- =====================================================================
-- Después de aplicar esta migración, promueve manualmente al primer admin:
--
--   update public.profiles
--   set role = 'admin'
--   where id = (select id from auth.users where email = 'tu@email.com');
--
-- Cualquier admin posterior se puede promover desde la UI (cuando esté lista)
-- o repitiendo este UPDATE.
-- =====================================================================
