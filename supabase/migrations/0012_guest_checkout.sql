-- =====================================================================
-- LINKU SUMMIT — Migración 0012
-- Checkout SIN registro previo: la compra se hace con un formulario
-- (datos de comprador + facturación) y el usuario se registra DESPUÉS
-- de pagar (vía OTP). Por eso:
--   - orders.user_id pasa a ser NULLABLE (orden de invitado).
--   - tickets_issued.user_id pasa a ser NULLABLE.
--   - Se agregan datos de comprador y facturación a orders.
-- Al registrarse (OTP), se vinculan las órdenes/boletas por email.
-- =====================================================================

-- --- ORDERS: user_id opcional + datos de comprador/facturación ---
alter table public.orders alter column user_id drop not null;

alter table public.orders
  add column if not exists buyer_name        text,
  add column if not exists buyer_email       text,
  add column if not exists buyer_phone       text,
  add column if not exists buyer_doc_type    text,   -- CC | CE | PA(pasaporte) | NIT | TI | PEP | OTRO
  add column if not exists buyer_doc_number  text,
  -- Facturación (puede ser la misma persona; billing_same lo indica)
  add column if not exists billing_same      boolean not null default true,
  add column if not exists billing_name      text,
  add column if not exists billing_doc_type  text,
  add column if not exists billing_doc_number text,
  add column if not exists billing_email     text,
  add column if not exists billing_address   text;

create index if not exists orders_buyer_email_idx on public.orders(lower(buyer_email));

-- --- TICKETS_ISSUED: user_id opcional ---
alter table public.tickets_issued alter column user_id drop not null;
create index if not exists tickets_issued_attendee_email_idx
  on public.tickets_issued(lower(attendee_email));

-- =====================================================================
-- RLS:
--   - INSERT de órdenes ahora lo hace el servidor con service_role
--     (checkout de invitado), que bypassa RLS. La policy de usuarios
--     autenticados se mantiene por compatibilidad.
--   - SELECT/lectura de orden de invitado en la página de éxito y el
--     polling se hace con service_role por `payment_reference` (la ref
--     aleatoria actúa como token de capacidad). No exponemos SELECT
--     anónimo en la tabla.
-- =====================================================================

-- (Sin cambios de policy aquí: las lecturas de invitado van por service_role.)
