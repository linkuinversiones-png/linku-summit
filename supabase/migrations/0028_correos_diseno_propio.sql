-- =====================================================================
-- LINKU SUMMIT — Migración 0028
-- Correos masivos: modo "Diseño propio" (sin plantilla LinkU, para correos
-- diseñados como imágenes). Idempotente y no destructiva.
-- =====================================================================

alter table public.email_campaigns
  add column if not exists custom_design boolean not null default false;
