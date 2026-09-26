-- =====================================================================
-- LINKU SUMMIT — Migración 0018
-- Tiers internos (Staff, Speaker): categorías de entrada que existen en
-- ticket_tiers y se administran desde /admin/tiers, pero NUNCA se muestran
-- al público ni se pueden comprar. Solo un admin registra personas ahí,
-- desde /admin/registros.
--
-- Depende de: 0005 (ticket_tiers).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Columna admin_only
-- ---------------------------------------------------------------------
alter table public.ticket_tiers
  add column if not exists admin_only boolean not null default false;

comment on column public.ticket_tiers.admin_only is
  'true = tier interno (Staff, Speaker, etc). No aparece en la landing, ni '
  'en el JSON-LD, ni se puede comprar por /checkout: solo un admin registra '
  'personas ahí desde /admin/registros.';

-- ---------------------------------------------------------------------
-- 2. price_cop > 0 salvo tiers internos, que pueden valer 0 (cortesía)
-- ---------------------------------------------------------------------
do $$
declare
  c text;
begin
  -- El nombre del check lo pone Postgres solo; lo buscamos por la columna
  -- que restringe en vez de asumir 'ticket_tiers_price_cop_check', para que
  -- esta migración no falle si en algún ambiente quedó con otro nombre.
  select conname into c
    from pg_constraint
   where conrelid = 'public.ticket_tiers'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) ilike '%price_cop%';

  if c is not null then
    execute format('alter table public.ticket_tiers drop constraint %I', c);
  end if;

  alter table public.ticket_tiers
    add constraint ticket_tiers_price_cop_check
    check (price_cop > 0 or (admin_only and price_cop >= 0));
end$$;

-- ---------------------------------------------------------------------
-- 3. Seed: Staff y Speaker
--
-- price_cop = 0, active = true, admin_only = true. sort_order alto para
-- que, si algún día se relaja el filtro admin_only por error, queden al
-- final de cualquier listado ordenado por sort_order.
-- ---------------------------------------------------------------------
insert into public.ticket_tiers (
  slug, name_es, name_en, label_es, label_en,
  price_cop, benefits_es, benefits_en,
  highlight, cta_label_es, cta_label_en, cta_href,
  active, admin_only, sort_order
) values
  (
    'staff',
    'Staff', 'Staff',
    null, null,
    0, array[]::text[], array[]::text[],
    false, 'Comprar entrada', 'Buy ticket', '/checkout',
    true, true, 900
  ),
  (
    'speaker',
    'Speaker', 'Speaker',
    null, null,
    0, array[]::text[], array[]::text[],
    false, 'Comprar entrada', 'Buy ticket', '/checkout',
    true, true, 910
  )
on conflict (slug) do nothing;

-- No se toca la política RLS pública ("Public can read active tiers"): los
-- nombres de estos tiers no son secretos y /me necesita poder leerlos con
-- la sesión del propio usuario para mostrar el nombre de su boleta si algún
-- día un staff/speaker reclama su registro. El filtro que importa (que no
-- aparezcan en la landing ni se puedan comprar) va en código: admin_only se
-- excluye explícitamente en getActiveTiers() (lib/tickets.ts).
