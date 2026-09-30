-- =====================================================================
-- LINKU SUMMIT — Migración 0022
-- Ajustes privados: las filas de site_settings cuya clave empieza por
-- "private_" solo las pueden leer los admins (p. ej. la clave compartida
-- de la plataforma de citas). El resto sigue siendo de lectura pública.
-- Idempotente y no destructiva: solo reemplaza la política de lectura.
-- =====================================================================

drop policy if exists "Public read site_settings" on public.site_settings;
create policy "Public read site_settings"
  on public.site_settings for select
  using (left(key, 8) <> 'private_' or public.is_admin());

comment on table public.site_settings is
  'Ajustes del sitio editables desde /admin/settings. Lectura pública (salvo claves private_*, solo admin), escritura admin.';
