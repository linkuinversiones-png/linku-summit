-- =====================================================================
-- LINKU SUMMIT — Migración 0007
-- Permite que los usuarios autenticados creen sus PROPIAS órdenes.
-- Sin esta policy, el server component de /checkout no podía insertar
-- la orden (RLS bloqueaba el INSERT silenciosamente).
-- =====================================================================

drop policy if exists "Users can create own orders" on public.orders;
create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Update propio limitado: por ahora no permitimos que el usuario edite su
-- orden después de creada. El webhook usa service_role (que bypassa RLS).
-- Si en el futuro queremos permitir cancelar la propia orden pendiente,
-- añadir aquí.
