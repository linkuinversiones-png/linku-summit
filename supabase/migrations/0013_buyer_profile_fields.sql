-- 0013: Campos de perfil profesional del comprador en orders.
-- Empresa/organización y cargo (requeridos en el form), LinkedIn opcional
-- para facilitar networking durante el evento.

alter table public.orders
  add column if not exists buyer_company  text,
  add column if not exists buyer_position text,
  add column if not exists buyer_linkedin text;

comment on column public.orders.buyer_company  is 'Organización o empresa del comprador';
comment on column public.orders.buyer_position is 'Cargo del comprador';
comment on column public.orders.buyer_linkedin is 'URL de LinkedIn (opcional, para networking)';
