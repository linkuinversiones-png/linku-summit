-- =====================================================================
-- LINKU SUMMIT — Migración 0011
-- Tabla sponsors: catálogo administrable de sponsors y aliados con logo
-- + website + LinkedIn. Reemplaza la lectura directa del Storage que
-- hacía SponsorsWall.
-- =====================================================================

create table if not exists public.sponsors (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,

  name text not null,
  -- Categoría: 'series-c' | 'series-b' | 'series-a' | 'pre-series-a' |
  --           'seed' | 'pre-seed' | 'angel' | 'aliados'
  category text not null,
  logo_path text,  -- path en bucket summit-media/sponsors/...
  website_url text,
  linkedin_url text,

  sort_order integer not null default 0,
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sponsors_category_sort_idx
  on public.sponsors(category, sort_order);
create index if not exists sponsors_active_idx on public.sponsors(active);

drop trigger if exists sponsors_updated_at on public.sponsors;
create trigger sponsors_updated_at
  before update on public.sponsors
  for each row execute function public.handle_updated_at();

alter table public.sponsors enable row level security;

drop policy if exists "Public can read active sponsors" on public.sponsors;
create policy "Public can read active sponsors"
  on public.sponsors for select
  using (active = true);

drop policy if exists "Admins manage sponsors" on public.sponsors;
create policy "Admins manage sponsors"
  on public.sponsors for all
  using (public.is_admin())
  with check (public.is_admin());
