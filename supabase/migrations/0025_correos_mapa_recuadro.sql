-- =====================================================================
-- LINKU SUMMIT — Migración 0025
-- Correos masivos: sección "Cómo llegar" (mapa) y recuadro destacado.
-- Idempotente y no destructiva: solo agrega columnas a email_campaigns.
-- =====================================================================

alter table public.email_campaigns
  add column if not exists include_map boolean not null default false,
  add column if not exists box_title text,
  add column if not exists box_intro text,
  add column if not exists box_lines text;
