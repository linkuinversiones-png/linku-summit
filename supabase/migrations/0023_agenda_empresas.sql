-- =====================================================================
-- LINKU SUMMIT — Migración 0023
-- Empresas vinculadas a la agenda (ej. Elevator Pitches por clase de
-- activo). Las empresas salen del catálogo de `sponsors`; las que no son
-- sponsors se crean allí con la categoría "empresa-agenda" (que el muro
-- público ignora). `sponsors.category` no tiene CHECK, no hay que tocarlo.
-- Idempotente y no destructiva: solo crea tablas, índices y políticas.
-- =====================================================================

create table if not exists public.agenda_item_companies (
  item_id    uuid not null references public.agenda_items(id) on delete cascade,
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  sort_order int  not null default 0,
  primary key (item_id, sponsor_id)
);

create table if not exists public.agenda_salon_item_companies (
  salon_item_id uuid not null references public.agenda_salon_items(id) on delete cascade,
  sponsor_id    uuid not null references public.sponsors(id) on delete cascade,
  sort_order    int  not null default 0,
  primary key (salon_item_id, sponsor_id)
);

create index if not exists agenda_item_companies_sponsor_idx
  on public.agenda_item_companies(sponsor_id);
create index if not exists agenda_salon_item_companies_sponsor_idx
  on public.agenda_salon_item_companies(sponsor_id);

alter table public.agenda_item_companies enable row level security;
alter table public.agenda_salon_item_companies enable row level security;

-- Solo contienen ids; el sponsor en sí sigue filtrado por su propia RLS
-- (anónimos ven solo active = true).
drop policy if exists "Public read agenda_item_companies" on public.agenda_item_companies;
create policy "Public read agenda_item_companies"
  on public.agenda_item_companies for select using (true);

drop policy if exists "Public read agenda_salon_item_companies" on public.agenda_salon_item_companies;
create policy "Public read agenda_salon_item_companies"
  on public.agenda_salon_item_companies for select using (true);

drop policy if exists "Admins manage agenda_item_companies" on public.agenda_item_companies;
create policy "Admins manage agenda_item_companies"
  on public.agenda_item_companies for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage agenda_salon_item_companies" on public.agenda_salon_item_companies;
create policy "Admins manage agenda_salon_item_companies"
  on public.agenda_salon_item_companies for all
  using (public.is_admin()) with check (public.is_admin());
