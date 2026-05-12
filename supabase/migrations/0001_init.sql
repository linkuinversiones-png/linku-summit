-- =====================================================================
-- LINKU SUMMIT — Migración inicial 0001
-- Crea: tabla profiles + trigger autopopulado + RLS basicas
-- Cómo aplicar: pegar este archivo entero en Supabase Dashboard
--               → SQL Editor → New query → Run.
-- =====================================================================

-- Extensión para UUIDs (Supabase la trae activa por defecto, idempotente)
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- TABLA: profiles
-- Datos extra de cada usuario, ligados 1:1 con auth.users (id mismo UUID)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  -- Rol del usuario dentro del summit:
  --   'investor'  = LP / family office / wealth
  --   'founder'   = founder en ronda
  --   'sponsor'   = marca patrocinadora
  --   'partner'   = aliado institucional
  --   'attendee'  = asistente general
  --   'admin'     = staff LinkU
  role text check (role in ('investor','founder','sponsor','partner','attendee','admin')),
  company text,
  position text,
  phone text,
  bio text,
  avatar_url text,
  linkedin_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Actualizar updated_at automáticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- ---------------------------------------------------------------------
-- TRIGGER: crear profile automáticamente al hacer signup
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Borrar políticas previas si existieran (para re-correr la migración sin error)
drop policy if exists "Anyone can view profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- Cualquiera puede LEER perfiles (necesario para el directorio de speakers, networking)
create policy "Anyone can view profiles"
  on public.profiles for select
  using (true);

-- Solo el dueño puede EDITAR su perfil
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Solo el dueño puede INSERTAR su propio perfil (el trigger lo hace, pero por si acaso)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- ÍNDICES
-- ---------------------------------------------------------------------
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_company_idx on public.profiles(company);

-- =====================================================================
-- FIN MIGRACIÓN 0001
-- Pasos siguientes (NO se aplican aquí, son notas para Claude):
-- 0002: tickets_orders, tickets_issued (con QR), coupons
-- 0003: meeting_slots, meeting_requests (agenda P2P)
-- =====================================================================
