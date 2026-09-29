-- =====================================================================
-- LINKU SUMMIT — Migración 0019
-- Registros internos (Staff, Speaker, Prensa) con precio 0: la 0018 relajó
-- el check de ticket_tiers.price_cop, pero orders.subtotal_cop seguía con
-- check (subtotal_cop > 0) (0003) y el INSERT de /admin/registros fallaba
-- con "violates check constraint orders_subtotal_cop_check".
--
-- Ahora subtotal_cop puede ser 0 SOLO si la orden es una cortesía
-- (payment_method = 'cortesia'). Cualquier otra orden sigue exigiendo > 0.
-- total_cop y discount_cop ya permiten 0 (>= 0), no se tocan.
--
-- Idempotente y no destructiva: no borra ni cambia filas, solo reemplaza
-- el check. Depende de: 0003 (orders), 0015 (payment_method).
-- =====================================================================
do $$
declare
  c record;
begin
  -- El nombre del check lo pone Postgres solo; lo buscamos por la columna
  -- que restringe (igual que la 0018) en vez de asumir el nombre. Si ya
  -- existe la versión nueva (segunda corrida) también cae aquí y se
  -- recrea igual, así que correrla otra vez no falla ni duplica nada.
  for c in
    select conname
      from pg_constraint
     where conrelid = 'public.orders'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%subtotal_cop%'
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;

  -- Se crea normal (con validación): las filas existentes tienen todas
  -- subtotal_cop > 0, así que cumplen la nueva regla y no hay riesgo.
  alter table public.orders
    add constraint orders_subtotal_cop_check
    check (subtotal_cop > 0 or (subtotal_cop = 0 and payment_method = 'cortesia'));
end$$;
