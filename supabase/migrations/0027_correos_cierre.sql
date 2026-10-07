-- =====================================================================
-- LINKU SUMMIT — Migración 0027
-- Correos masivos: frase de cierre editable por campaña.
-- null = campaña anterior (cierre por defecto "Nos vemos en Medellín.");
-- cadena vacía = sin cierre. Idempotente y no destructiva.
-- =====================================================================

alter table public.email_campaigns
  add column if not exists closing text;
