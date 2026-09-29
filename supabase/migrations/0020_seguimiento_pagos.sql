-- =====================================================================
-- LINKU SUMMIT — Migración 0020
-- Seguimiento de pagos rechazados/pendientes: historial de casos que un
-- admin marcó como resueltos desde el panel "Por resolver" de /admin/orders.
--
-- Solo-append: la app inserta, nunca edita ni borra. Varias filas por
-- comprador; vale la más reciente. Un caso reaparece si el comprador tiene
-- un intento nuevo posterior a resolved_at.
--
-- Depende de: 0004 (is_admin). Idempotente y no destructiva.
-- =====================================================================

create table if not exists public.payment_followups (
  id uuid primary key default uuid_generate_v4(),
  -- Clave de agrupación del comprador: 'doc:<documento>' o 'email:<correo>'.
  buyer_key text not null,
  buyer_email text,
  buyer_name text,
  resolution text not null check (resolution in
    ('pago_otro_medio', 'cortesia', 'desistio', 'contactado', 'otro')),
  note text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_by_email text,
  resolved_at timestamptz not null default now()
);

create index if not exists payment_followups_buyer_idx
  on public.payment_followups(buyer_key, resolved_at desc);

alter table public.payment_followups enable row level security;

drop policy if exists "Admins read payment_followups" on public.payment_followups;
create policy "Admins read payment_followups"
  on public.payment_followups for select
  using (public.is_admin());

drop policy if exists "Admins insert payment_followups" on public.payment_followups;
create policy "Admins insert payment_followups"
  on public.payment_followups for insert
  with check (public.is_admin());

comment on table public.payment_followups is
  'Historial de casos de pago rechazado/pendiente cerrados por un admin';
