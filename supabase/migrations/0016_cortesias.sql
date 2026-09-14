-- =====================================================================
-- LINKU SUMMIT — Migración 0016
-- Cortesías: cupones que dejan la entrada en $0 y se saltan la pasarela.
--
--   1. coupons.kind distingue 'descuento' de 'cortesia', más los datos de
--      a quién se otorgó la cortesía (persona u organización) y por qué.
--   2. coupon_redemptions.user_id pasa a NULLABLE. Era NOT NULL y el
--      checkout de invitado (user_id null) hacía fallar el INSERT en
--      silencio: por eso ningún cupón ha contado nunca un uso y un
--      código de "1 uso" se podía usar sin límite.
--
-- Depende de: 0003 (coupons), 0009 (coupon_redemptions), 0012 (invitado).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Cortesías en coupons
-- ---------------------------------------------------------------------
alter table public.coupons
  add column if not exists kind text not null default 'descuento',
  -- Para qué se otorgó: aliado, sponsor, speaker, prensa, staff, comunidad…
  add column if not exists courtesy_category text,
  -- A quién. Para cortesías nominales (1 uso) van nombre y correo; para
  -- cortesías de comunidad (N usos) basta la organización.
  add column if not exists granted_to_name  text,
  add column if not exists granted_to_email text,
  add column if not exists granted_to_org   text,
  -- Quién la creó (snapshot del correo del admin) y notas internas.
  add column if not exists granted_by_email text,
  add column if not exists notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'coupons_kind_check') then
    alter table public.coupons
      add constraint coupons_kind_check check (kind in ('descuento', 'cortesia'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'coupons_courtesy_category_check') then
    alter table public.coupons
      add constraint coupons_courtesy_category_check
      check (courtesy_category is null or courtesy_category in
        ('aliado', 'sponsor', 'speaker', 'prensa', 'staff', 'comunidad', 'invitado', 'otro'));
  end if;
  -- Una cortesía siempre es 100 %: así el checkout puede confiar en que
  -- kind = 'cortesia' implica total $0.
  if not exists (select 1 from pg_constraint where conname = 'coupons_cortesia_es_total_check') then
    alter table public.coupons
      add constraint coupons_cortesia_es_total_check
      check (kind <> 'cortesia' or (discount_type = 'percent' and discount_value = 100));
  end if;
end$$;

create index if not exists coupons_kind_idx on public.coupons(kind);

comment on column public.coupons.kind is
  'descuento = rebaja parcial; cortesia = entrada gratis, salta la pasarela';

-- Backfill: los cupones al 100 % que ya existen son cortesías.
update public.coupons
   set kind = 'cortesia'
 where kind = 'descuento'
   and discount_type = 'percent'
   and discount_value = 100;

-- La organización, cuando la descripción sigue el patrón
-- "Para la comunidad de X" que usó el admin al crearlas a mano.
update public.coupons
   set granted_to_org = trim(regexp_replace(description, '^Para la comunidad de\s+(la\s+)?', '', 'i')),
       courtesy_category = 'comunidad'
 where kind = 'cortesia'
   and granted_to_org is null
   and description ~* '^Para la comunidad de';

-- ---------------------------------------------------------------------
-- 2. Redenciones de invitados
-- ---------------------------------------------------------------------
alter table public.coupon_redemptions alter column user_id drop not null;

comment on column public.coupon_redemptions.user_id is
  'Null cuando la compra fue sin cuenta (checkout de invitado)';
