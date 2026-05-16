-- =====================================================================
-- LINKU SUMMIT — Migración 0010
-- Tabla speakers: catálogo administrable de ponentes con foto + LinkedIn
-- Reemplaza el JSON content/{es,en}/speakers.json
-- =====================================================================

create table if not exists public.speakers (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,

  name text not null,
  role text not null default '',
  company text not null default '',
  track text not null default '',
  bio_es text,
  bio_en text,
  linkedin_url text,
  avatar_path text,  -- path en bucket summit-media/speakers/ o null
  confirmed boolean not null default true,

  sort_order integer not null default 0,
  active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists speakers_active_idx on public.speakers(active, sort_order);
create index if not exists speakers_slug_idx on public.speakers(slug);

drop trigger if exists speakers_updated_at on public.speakers;
create trigger speakers_updated_at
  before update on public.speakers
  for each row execute function public.handle_updated_at();

alter table public.speakers enable row level security;

drop policy if exists "Public can read active speakers" on public.speakers;
create policy "Public can read active speakers"
  on public.speakers for select
  using (active = true);

drop policy if exists "Admins manage speakers" on public.speakers;
create policy "Admins manage speakers"
  on public.speakers for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Seed: migrar los 9 speakers actuales del JSON estático
-- ---------------------------------------------------------------------
insert into public.speakers (
  slug, name, role, company, track, avatar_path, confirmed, sort_order
) values
  ('alejandro-pardo', 'Alejandro Pardo', 'Fundador', 'Satto', 'Desarrollo inmobiliario', 'speakers/alejandro-pardo.jpg', true, 10),
  ('harold-calderon', 'Harold Calderón', 'Gestor profesional', '', 'Venture Capital', 'speakers/harold-calderon.jpg', true, 20),
  ('camilo-merino', 'Camilo Merino', 'Estructuración legal de fondos', '', 'Legal & compliance', 'speakers/camilo-merino.jpg', true, 30),
  ('juan-fernando-velez', 'Juan Fernando Vélez', 'Head of Investment', 'Family Office de artistas', 'Family office', 'speakers/juan-fernando-velez.jpg', true, 40),
  ('mauricio-restrepo', 'Mauricio Restrepo del Toro', 'Principal', 'Family Office', 'Family office', 'speakers/mauricio-restrepo-del-toro.jpg', true, 50),
  ('sergio-mejia', 'Sergio Mejía', 'Pro Investments', '', 'Inversión en deportistas', 'speakers/sergio-mejia.jpg', true, 60),
  ('johnatan-combeau', 'Johnatan Combeau', 'VP Wealth Management', 'Credicorp', 'Wealth Management', 'speakers/jonathan-combeau.png', true, 70),
  ('matias-gonzalez', 'Matías González', 'Por confirmar', '', 'Por confirmar', 'speakers/matias-gonzalez.png', true, 80),
  ('keynote-internacional', 'Por confirmar', 'Keynote internacional', '', 'Cierre del summit', null, false, 90)
on conflict (slug) do nothing;
