-- =====================================================================
-- LINKU SUMMIT — Migración 0008
-- Renombra columnas wompi_* a payment_* (neutro), para soportar
-- cambio de pasarela a ePayco sin atar el schema a un proveedor.
--
-- Antes:
--   orders.wompi_reference       text unique not null
--   orders.wompi_transaction_id  text
--
-- Después:
--   orders.payment_reference     text unique not null
--   orders.payment_provider_id   text
-- =====================================================================

alter table public.orders rename column wompi_reference to payment_reference;
alter table public.orders rename column wompi_transaction_id to payment_provider_id;

-- Las constraints únicas e índices arrastran el nombre nuevo automáticamente
-- al renombrar la columna, pero el nombre del índice queda con el viejo.
-- Limpieza opcional (no rompe nada si falla):
do $$
begin
  if exists (select 1 from pg_indexes where indexname = 'orders_wompi_reference_key') then
    alter index public.orders_wompi_reference_key rename to orders_payment_reference_key;
  end if;
end$$;
