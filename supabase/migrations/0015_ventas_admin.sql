-- =====================================================================
-- LINKU SUMMIT — Migración 0015
-- Gestión de ventas desde el admin:
--   1. Bitácora de cambios de estado de una orden (order_status_log).
--   2. Registro de si la orden se envió a InContacto y con qué resultado.
--   3. Método de pago, para distinguir Wompi de efectivo / bono / cortesía.
--
-- Depende de: 0003 (orders), 0004 (is_admin), 0012 (buyer_*).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Método de pago y sincronización con InContacto
-- ---------------------------------------------------------------------
alter table public.orders
  -- Cómo se pagó. 'wompi' lo pone el webhook; el resto son altas manuales
  -- hechas por un admin desde /admin/orders.
  add column if not exists payment_method text,

  -- Estado del envío del asistente a la API de InContacto.
  --   null      → todavía no se intentó (orden sin pagar)
  --   'sent'    → InContacto lo aceptó (o ya existía: la API deduplica por documento)
  --   'error'   → se intentó y falló; el detalle queda en incontacto_error
  --   'skipped' → no se intentó por falta de token o de número de documento
  add column if not exists incontacto_status text,
  add column if not exists incontacto_synced_at timestamptz,
  add column if not exists incontacto_error text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_method_check'
  ) then
    alter table public.orders
      add constraint orders_payment_method_check
      check (payment_method is null or payment_method in
        ('wompi', 'efectivo', 'bono', 'cortesia', 'transferencia', 'otro'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_incontacto_status_check'
  ) then
    alter table public.orders
      add constraint orders_incontacto_status_check
      check (incontacto_status is null or incontacto_status in
        ('sent', 'error', 'skipped'));
  end if;
end$$;

comment on column public.orders.payment_method is
  'wompi (pasarela) o el medio manual con que un admin la marcó pagada';
comment on column public.orders.incontacto_status is
  'Resultado del registro del asistente en InContacto: sent | error | skipped';

create index if not exists orders_incontacto_status_idx
  on public.orders(incontacto_status);

-- Las órdenes ya pagadas antes de esta migración se pagaron por Wompi.
update public.orders
   set payment_method = 'wompi'
 where status = 'paid' and payment_method is null;

-- ---------------------------------------------------------------------
-- 2. Bitácora de cambios de estado
--
-- Una fila por cada cambio. Nunca se borra ni se edita: es el registro
-- de auditoría de por qué una venta terminó en el estado en que está.
-- ---------------------------------------------------------------------
create table if not exists public.order_status_log (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,

  from_status text,            -- null en el evento de creación
  to_status text not null,

  -- Motivo del cambio. Códigos cerrados para poder reportar por ellos.
  --   efectivo | bono | cortesia | transferencia  → cómo se pagó
  --   correccion | reembolso | expiracion | otro  → ajustes administrativos
  --   pago_wompi                                  → lo escribió el webhook
  reason text not null,
  note text,                   -- explicación libre que escribe el admin

  -- Quién lo hizo. Guardamos el email como snapshot para que la bitácora
  -- siga siendo legible aunque el usuario se borre.
  changed_by uuid references auth.users(id) on delete set null,
  changed_by_email text,
  source text not null default 'admin' check (source in ('admin', 'webhook', 'sistema')),

  created_at timestamptz not null default now()
);

create index if not exists order_status_log_order_idx
  on public.order_status_log(order_id, created_at desc);

alter table public.order_status_log enable row level security;

-- Solo los admins leen la bitácora. Las escrituras las hace el servidor con
-- service_role (que bypassa RLS), igual que el webhook.
drop policy if exists "Admins read order_status_log" on public.order_status_log;
create policy "Admins read order_status_log"
  on public.order_status_log for select
  using (public.is_admin());

comment on table public.order_status_log is
  'Auditoría inmutable de los cambios de estado de cada orden';
