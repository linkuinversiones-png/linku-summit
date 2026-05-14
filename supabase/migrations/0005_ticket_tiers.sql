-- =====================================================================
-- LINKU SUMMIT — Migración 0005
-- Tabla ticket_tiers: catálogo administrable de entradas con campos bilingües
-- Reemplaza el JSON estático content/{es,en}/tickets.json (parte de tiers).
-- Depende de: 0001_init.sql (handle_updated_at, is_admin viene de 0004)
-- =====================================================================

create table if not exists public.ticket_tiers (
  id uuid primary key default uuid_generate_v4(),
  -- slug estable, usado en orders.ticket_tier
  slug text not null unique,

  -- Contenido bilingüe
  name_es text not null,
  name_en text not null,
  label_es text,
  label_en text,
  price_note_es text,
  price_note_en text,
  benefits_es text[] not null default '{}',
  benefits_en text[] not null default '{}',
  badge_es text,
  badge_en text,
  cta_label_es text not null default 'Comprar entrada',
  cta_label_en text not null default 'Buy ticket',
  cta_href text not null default '/checkout',

  -- Comercial
  price_cop integer not null check (price_cop > 0),
  max_quantity integer check (max_quantity is null or max_quantity > 0),
  sold_count integer not null default 0 check (sold_count >= 0),

  -- Visibilidad
  highlight boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  visible_from timestamptz,
  visible_until timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ticket_tiers_active_idx on public.ticket_tiers(active, sort_order);
create index if not exists ticket_tiers_slug_idx on public.ticket_tiers(slug);

drop trigger if exists ticket_tiers_updated_at on public.ticket_tiers;
create trigger ticket_tiers_updated_at
  before update on public.ticket_tiers
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.ticket_tiers enable row level security;

-- Lectura pública de los activos (la landing los muestra)
drop policy if exists "Public can read active tiers" on public.ticket_tiers;
create policy "Public can read active tiers"
  on public.ticket_tiers for select
  using (active = true);

-- Admins pueden hacer todo (ver inclusive inactivos, crear, editar, borrar)
drop policy if exists "Admins can manage tiers" on public.ticket_tiers;
create policy "Admins can manage tiers"
  on public.ticket_tiers for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Seed: migrar contenido actual desde el JSON
-- ---------------------------------------------------------------------
insert into public.ticket_tiers (
  slug, name_es, name_en, label_es, label_en,
  price_cop, price_note_es, price_note_en,
  benefits_es, benefits_en,
  highlight, badge_es, badge_en,
  cta_label_es, cta_label_en, cta_href,
  sort_order
) values
  (
    'early-investor',
    'Early Investor', 'Early Investor',
    'Acceso temprano', 'Early access',
    1500000,
    'Tarifa válida hasta agotar primer cupo',
    'Rate valid until first quota sells out',
    array[
      'Pase a los 2 días del summit',
      'Acceso a feria y stands curados',
      'Almuerzos por mesa temática',
      'Cocktail de bienvenida (Día 1)',
      'App del evento con agenda y networking'
    ],
    array[
      'Access to both days of the summit',
      'Access to expo and curated booths',
      'Themed-table lunches',
      'Welcome cocktail (Day 1)',
      'Event app with agenda and networking'
    ],
    false, null, null,
    'Comprar entrada', 'Buy ticket', '/checkout?tier=early-investor',
    10
  ),
  (
    'smart-investor',
    'Smart Investor', 'Smart Investor',
    'Acceso completo', 'Full access',
    3000000,
    'Cupo limitado. Incluye experiencias VIP.',
    'Limited spots. Includes VIP experiences.',
    array[
      'Todo lo del Early Investor',
      'Acceso al deal room 1:1',
      'Cena de cierre · solo por invitación',
      'Curaduría personalizada de 5 reuniones',
      'Asiento prioritario en escenario principal',
      'Kit de bienvenida co-branded'
    ],
    array[
      'Everything in Early Investor',
      'Access to 1:1 deal room',
      'Closing dinner · invitation only',
      'Personalized curation of 5 meetings',
      'Priority seating on main stage',
      'Co-branded welcome kit'
    ],
    true, 'MÁS POPULAR', 'MOST POPULAR',
    'Comprar entrada', 'Buy ticket', '/checkout?tier=smart-investor',
    20
  )
on conflict (slug) do nothing;
