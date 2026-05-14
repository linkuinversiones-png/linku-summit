-- =====================================================================
-- LINKU SUMMIT — Migración 0006
-- Quita el CHECK constraint hardcoded sobre orders.ticket_tier y
-- tickets_issued.ticket_tier para permitir tiers administrables
-- definidos en la tabla public.ticket_tiers.
--
-- Antes (0003): check (ticket_tier in ('early-investor','smart-investor'))
-- Ahora: validación se delega a la presencia de un slug en ticket_tiers.
-- Depende de: 0003_orders_tickets_coupons.sql, 0005_ticket_tiers.sql
-- =====================================================================

-- Postgres asigna automáticamente nombre orders_ticket_tier_check al
-- constraint anónimo de la columna. Si por alguna razón está nombrado
-- distinto, el IF EXISTS hace la operación idempotente.
alter table public.orders
  drop constraint if exists orders_ticket_tier_check;

-- En tickets_issued no había check (la migración 0003 no lo puso),
-- pero hacemos el drop por idempotencia.
alter table public.tickets_issued
  drop constraint if exists tickets_issued_ticket_tier_check;

-- Validación de integridad referencial: el slug del tier debe existir
-- en ticket_tiers (FK soft, con ON UPDATE CASCADE para soportar renames
-- de slug en el futuro, y SET NULL en delete porque preferimos preservar
-- el histórico de orders aunque borren el tier).
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'orders_ticket_tier_fkey'
      and table_name = 'orders'
  ) then
    alter table public.orders
      add constraint orders_ticket_tier_fkey
      foreign key (ticket_tier) references public.ticket_tiers(slug)
      on update cascade on delete set null;
  end if;
end $$;

-- tickets_issued.ticket_tier: misma FK
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'tickets_issued_ticket_tier_fkey'
      and table_name = 'tickets_issued'
  ) then
    alter table public.tickets_issued
      add constraint tickets_issued_ticket_tier_fkey
      foreign key (ticket_tier) references public.ticket_tiers(slug)
      on update cascade on delete set null;
  end if;
end $$;
