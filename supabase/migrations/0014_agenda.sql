-- =====================================================================
-- LINKU SUMMIT — Migración 0014
-- Agenda administrable: días, bloques, salones paralelos y subagendas.
-- Reemplaza el JSON content/{es,en}/agenda.json como fuente de verdad.
--
-- Jerarquía:
--   agenda_days (Día 1 / Día 2)
--     └── agenda_items (bloques con horario: charla, panel, break…)
--           ├── agenda_item_speakers (vínculo opcional a speakers)
--           └── agenda_salones (tracks paralelos: A, B, C…)
--                 └── agenda_salon_items (subagenda de cada salón)
--                       └── agenda_salon_item_speakers
--
-- Seguridad: público solo lee lo activo; escrituras solo via is_admin().
-- =====================================================================

-- ---------------------------------------------------------------------
-- Días
-- ---------------------------------------------------------------------
create table if not exists public.agenda_days (
  id uuid primary key default uuid_generate_v4(),
  day_number integer not null unique,
  label_es text not null,
  label_en text,
  date date,
  tagline_es text,
  tagline_en text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Bloques de agenda
-- ---------------------------------------------------------------------
create table if not exists public.agenda_items (
  id uuid primary key default uuid_generate_v4(),
  day_id uuid not null references public.agenda_days(id) on delete cascade,
  sort_order integer not null default 0,

  start_time text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time text check (end_time is null or end_time ~ '^\d{2}:\d{2}$'),
  type text not null default 'charla',

  title_es text not null,
  title_en text,
  desc_es text not null default '',
  desc_en text,

  -- Texto libre para el crédito de speakers ("4 panelistas + moderador").
  -- Si hay speakers vinculados en agenda_item_speakers, estos tienen prioridad.
  speaker_label_es text,
  speaker_label_en text,

  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agenda_items_day_idx
  on public.agenda_items(day_id, active, sort_order);

-- ---------------------------------------------------------------------
-- Salones paralelos dentro de un bloque
-- ---------------------------------------------------------------------
create table if not exists public.agenda_salones (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.agenda_items(id) on delete cascade,
  sort_order integer not null default 0,

  code text not null,          -- 'A', 'B', '1:1', 'Feria'…
  name_es text not null,
  name_en text,
  tag_es text,
  tag_en text,

  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agenda_salones_item_idx
  on public.agenda_salones(item_id, active, sort_order);

-- ---------------------------------------------------------------------
-- Subagenda de cada salón
-- ---------------------------------------------------------------------
create table if not exists public.agenda_salon_items (
  id uuid primary key default uuid_generate_v4(),
  salon_id uuid not null references public.agenda_salones(id) on delete cascade,
  sort_order integer not null default 0,

  start_time text check (start_time is null or start_time ~ '^\d{2}:\d{2}$'),
  end_time text check (end_time is null or end_time ~ '^\d{2}:\d{2}$'),

  title_es text not null,
  title_en text,
  desc_es text not null default '',
  desc_en text,
  speaker_label_es text,
  speaker_label_en text,

  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agenda_salon_items_salon_idx
  on public.agenda_salon_items(salon_id, active, sort_order);

-- ---------------------------------------------------------------------
-- Vínculos opcionales con el catálogo de speakers
-- ---------------------------------------------------------------------
create table if not exists public.agenda_item_speakers (
  item_id uuid not null references public.agenda_items(id) on delete cascade,
  speaker_id uuid not null references public.speakers(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (item_id, speaker_id)
);

create table if not exists public.agenda_salon_item_speakers (
  salon_item_id uuid not null references public.agenda_salon_items(id) on delete cascade,
  speaker_id uuid not null references public.speakers(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (salon_item_id, speaker_id)
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
drop trigger if exists agenda_days_updated_at on public.agenda_days;
create trigger agenda_days_updated_at
  before update on public.agenda_days
  for each row execute function public.handle_updated_at();

drop trigger if exists agenda_items_updated_at on public.agenda_items;
create trigger agenda_items_updated_at
  before update on public.agenda_items
  for each row execute function public.handle_updated_at();

drop trigger if exists agenda_salones_updated_at on public.agenda_salones;
create trigger agenda_salones_updated_at
  before update on public.agenda_salones
  for each row execute function public.handle_updated_at();

drop trigger if exists agenda_salon_items_updated_at on public.agenda_salon_items;
create trigger agenda_salon_items_updated_at
  before update on public.agenda_salon_items
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.agenda_days enable row level security;
alter table public.agenda_items enable row level security;
alter table public.agenda_salones enable row level security;
alter table public.agenda_salon_items enable row level security;
alter table public.agenda_item_speakers enable row level security;
alter table public.agenda_salon_item_speakers enable row level security;

drop policy if exists "Public read active agenda_days" on public.agenda_days;
create policy "Public read active agenda_days"
  on public.agenda_days for select using (active = true);

drop policy if exists "Public read active agenda_items" on public.agenda_items;
create policy "Public read active agenda_items"
  on public.agenda_items for select using (active = true);

drop policy if exists "Public read active agenda_salones" on public.agenda_salones;
create policy "Public read active agenda_salones"
  on public.agenda_salones for select using (active = true);

drop policy if exists "Public read active agenda_salon_items" on public.agenda_salon_items;
create policy "Public read active agenda_salon_items"
  on public.agenda_salon_items for select using (active = true);

-- Las tablas de vínculo solo contienen ids públicos (agenda ↔ speaker).
drop policy if exists "Public read agenda_item_speakers" on public.agenda_item_speakers;
create policy "Public read agenda_item_speakers"
  on public.agenda_item_speakers for select using (true);

drop policy if exists "Public read agenda_salon_item_speakers" on public.agenda_salon_item_speakers;
create policy "Public read agenda_salon_item_speakers"
  on public.agenda_salon_item_speakers for select using (true);

drop policy if exists "Admins manage agenda_days" on public.agenda_days;
create policy "Admins manage agenda_days"
  on public.agenda_days for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage agenda_items" on public.agenda_items;
create policy "Admins manage agenda_items"
  on public.agenda_items for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage agenda_salones" on public.agenda_salones;
create policy "Admins manage agenda_salones"
  on public.agenda_salones for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage agenda_salon_items" on public.agenda_salon_items;
create policy "Admins manage agenda_salon_items"
  on public.agenda_salon_items for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage agenda_item_speakers" on public.agenda_item_speakers;
create policy "Admins manage agenda_item_speakers"
  on public.agenda_item_speakers for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage agenda_salon_item_speakers" on public.agenda_salon_item_speakers;
create policy "Admins manage agenda_salon_item_speakers"
  on public.agenda_salon_item_speakers for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Seed: agenda actual del JSON (ES + EN), con las fechas nuevas 5–6 oct.
-- UUIDs fijos para que el seed sea idempotente (on conflict do nothing).
-- ---------------------------------------------------------------------
insert into public.agenda_days (id, day_number, label_es, label_en, date, tagline_es, tagline_en) values
  ('ad000000-0000-4000-8000-000000000001', 1,
   'Día 1 — Contexto, estrategia y especialización',
   'Day 1 — Context, strategy and specialization',
   '2026-10-05',
   'Leer el mundo, entender el patrimonio, especializarse por activo.',
   'Read the world, understand wealth, specialize by asset.'),
  ('ad000000-0000-4000-8000-000000000002', 2,
   'Día 2 — Inspiración y relacionamiento',
   'Day 2 — Inspiration and relationship-building',
   '2026-10-06',
   'Cargar de visión a la audiencia y abrir el espacio para hacer negocios.',
   'Fuel the audience with vision and open the space to do business.')
on conflict (day_number) do nothing;

insert into public.agenda_items
  (id, day_id, sort_order, start_time, end_time, type, title_es, title_en, desc_es, desc_en, speaker_label_es, speaker_label_en) values
  -- ---- Día 1 ----
  ('a1000000-0000-4000-8000-000000000101', 'ad000000-0000-4000-8000-000000000001', 10, '08:00', '09:00', 'registro',
   'Registro y café de bienvenida', 'Registration & welcome coffee',
   'Check-in y activación de la app del summit.', 'Check-in and summit app activation.', null, null),
  ('a1000000-0000-4000-8000-000000000102', 'ad000000-0000-4000-8000-000000000001', 20, '09:00', '09:20', 'apertura',
   'Apertura LinkU Ventures', 'LinkU Ventures opening',
   'Bienvenida, tesis del Summit y mapa de los dos días.', 'Welcome, summit thesis and roadmap of the two days.',
   'Equipo LinkU Ventures', 'LinkU Ventures team'),
  ('a1000000-0000-4000-8000-000000000103', 'ad000000-0000-4000-8000-000000000001', 30, '09:20', '10:00', 'charla',
   'Geopolítica y la oportunidad Colombia–Venezuela', 'Geopolitics and the Colombia–Venezuela opportunity',
   'Reapertura de Venezuela, reconfiguración regional, sectores con mayor upside y riesgos reales de la transición. Cómo se posiciona Colombia frente a esta nueva ventana.',
   'Venezuela reopening, regional reconfiguration, sectors with the biggest upside and real risks of the transition. How Colombia positions itself in this new window.',
   'Juliana [apellido por confirmar] — ex Vicepresidenta de ProColombia', 'Juliana [last name TBC] — former Vice President of ProColombia'),
  ('a1000000-0000-4000-8000-000000000104', 'ad000000-0000-4000-8000-000000000001', 40, '10:00', '10:40', 'charla',
   'Contexto macroeconómico global y su impacto en LatAm', 'Global macroeconomic context and its impact on LatAm',
   'Tasas, dólar, inflación, escenarios 2026–2027 y lectura para el inversionista latinoamericano.',
   'Rates, dollar, inflation, 2026–2027 scenarios and the read for the Latin American investor.',
   'Daniel Belandia (por confirmar)', 'Daniel Belandia (TBC)'),
  ('a1000000-0000-4000-8000-000000000105', 'ad000000-0000-4000-8000-000000000001', 50, '10:40', '11:00', 'break',
   'Coffee break', 'Coffee break',
   'Networking abierto en el lobby.', 'Open networking in the lobby.', null, null),
  ('a1000000-0000-4000-8000-000000000106', 'ad000000-0000-4000-8000-000000000001', 60, '11:00', '11:40', 'panel',
   'Family Offices: cómo invierten los patrimonios de élite', 'Family Offices: how elite wealth invests',
   'Gestor de patrimonios de artistas · Gestor de patrimonios de futbolistas · Family Office multifamily tradicional · Single Family Office UHNW. Conversación honesta sobre allocation real, oportunidades y retos.',
   'Wealth manager for artists · Wealth manager for footballers · Traditional multifamily office · UHNW single family office. Honest conversation about real allocation, opportunities and challenges.',
   '4 panelistas + moderador', '4 panelists + moderator'),
  ('a1000000-0000-4000-8000-000000000107', 'ad000000-0000-4000-8000-000000000001', 70, '11:40', '12:20', 'panel',
   'Wealth Management y Asset Allocation estratégica', 'Wealth Management & Strategic Asset Allocation',
   'Cómo construir y rebalancear un portafolio multi-asset hoy, en qué activos sobreponderar o subponderar, y marcos de decisión patrimonial.',
   'How to build and rebalance a multi-asset portfolio today, which assets to over or underweight, and wealth decision frameworks.',
   '3 speakers + moderador', '3 speakers + moderator'),
  ('a1000000-0000-4000-8000-000000000108', 'ad000000-0000-4000-8000-000000000001', 80, '12:20', '13:00', 'charla',
   'Estructuración patrimonial transfronteriza', 'Cross-border wealth structuring',
   'Jurisdicciones, vehículos, planeación sucesoria y cumplimiento en un entorno de mayor transparencia fiscal.',
   'Jurisdictions, vehicles, succession planning and compliance in an environment of greater fiscal transparency.',
   'Speaker por confirmar', 'Speaker TBC'),
  ('a1000000-0000-4000-8000-000000000109', 'ad000000-0000-4000-8000-000000000001', 90, '13:00', '14:00', 'comida',
   'Almuerzo networking', 'Networking lunch',
   'Mesas asignadas por afinidad temática.', 'Tables assigned by topic affinity.', null, null),
  ('a1000000-0000-4000-8000-000000000110', 'ad000000-0000-4000-8000-000000000001', 100, '14:00', '16:00', 'salones',
   'Salones especializados — elige tu track', 'Specialized tracks — pick yours',
   'Operación en paralelo durante 2 horas. 2 charlas de ~40 min con expertos por clase de activo, más espacio de preguntas.',
   'Running in parallel for 2 hours. 2 ~40-min talks with asset-class experts plus Q&A.', null, null),
  ('a1000000-0000-4000-8000-000000000111', 'ad000000-0000-4000-8000-000000000001', 110, '16:00', '17:00', 'pitch',
   'Elevator Pitches — proyectos por clase de activo', 'Elevator Pitches — projects by asset class',
   'Formato rápido: 5–7 minutos por proyecto, distribuidos por categoría (VC, RF/RV, alternativos, real estate, cripto). Inversionistas en sala y networking dirigido.',
   'Fast format: 5–7 minutes per project, split by category (VC, FI/Equities, alternatives, real estate, crypto). Investors in the room and directed networking.', null, null),
  ('a1000000-0000-4000-8000-000000000112', 'ad000000-0000-4000-8000-000000000001', 120, '17:00', '19:30', 'networking',
   'Cocktail de networking', 'Networking cocktail',
   'Música en vivo. Dress code business casual.', 'Live music. Dress code business casual.', null, null),
  -- ---- Día 2 ----
  ('a1000000-0000-4000-8000-000000000201', 'ad000000-0000-4000-8000-000000000002', 10, '08:00', '08:30', 'registro',
   'Café de bienvenida', 'Welcome coffee',
   'Recepción y activación de agendas 1:1 del día.', 'Reception and 1:1 agenda activation for the day.', null, null),
  ('a1000000-0000-4000-8000-000000000202', 'ad000000-0000-4000-8000-000000000002', 20, '08:30', '09:15', 'keynote',
   'Charla inspiracional · I', 'Inspirational talk · I',
   'Visión de largo plazo, legado y propósito del capital.', 'Long-term vision, legacy and purpose of capital.',
   'Speaker de alto perfil — por confirmar', 'High-profile speaker — TBC'),
  ('a1000000-0000-4000-8000-000000000203', 'ad000000-0000-4000-8000-000000000002', 30, '09:15', '10:00', 'keynote',
   'Charla inspiracional · II', 'Inspirational talk · II',
   'Conexión emocional con la audiencia patrimonial.', 'Emotional connection with the wealth audience.',
   'Caso de éxito o figura referente — por confirmar', 'Success story or reference figure — TBC'),
  ('a1000000-0000-4000-8000-000000000204', 'ad000000-0000-4000-8000-000000000002', 40, '10:00', '10:20', 'break',
   'Coffee break', 'Coffee break', '', '', null, null),
  ('a1000000-0000-4000-8000-000000000205', 'ad000000-0000-4000-8000-000000000002', 50, '10:20', '12:30', 'relacionamiento',
   'Bloque de relacionamiento', 'Relationship-building block',
   'Operación en paralelo, con agendas coordinadas vía la app del summit.',
   'Running in parallel, with agendas coordinated through the summit app.', null, null),
  ('a1000000-0000-4000-8000-000000000206', 'ad000000-0000-4000-8000-000000000002', 60, '12:30', '13:00', 'apertura',
   'Cierre LinkU Ventures', 'LinkU Ventures closing',
   'Síntesis del Summit, takeaways y próximos pasos.', 'Summit synthesis, takeaways and next steps.',
   'Equipo LinkU Ventures', 'LinkU Ventures team'),
  ('a1000000-0000-4000-8000-000000000207', 'ad000000-0000-4000-8000-000000000002', 70, '13:00', '15:00', 'comida',
   'Almuerzo de cierre', 'Closing lunch',
   'Mesas mixtas, cierre con los speakers principales.', 'Mixed tables, closing with main speakers.', null, null)
on conflict (id) do nothing;

insert into public.agenda_salones (id, item_id, sort_order, code, name_es, name_en, tag_es, tag_en) values
  -- Salones del bloque "Salones especializados" (Día 1, 14:00)
  ('a5000000-0000-4000-8000-000000000101', 'a1000000-0000-4000-8000-000000000110', 10, 'A',
   'Venture Capital y Private Equity', 'Venture Capital & Private Equity',
   'Crecimiento y capital privado', 'Growth and private capital'),
  ('a5000000-0000-4000-8000-000000000102', 'a1000000-0000-4000-8000-000000000110', 20, 'B',
   'Renta Fija y Renta Variable', 'Fixed Income & Equities',
   'Mercados líquidos', 'Liquid markets'),
  ('a5000000-0000-4000-8000-000000000103', 'a1000000-0000-4000-8000-000000000110', 30, 'C',
   'Alternativos: hedge funds, commodities, oro', 'Alternatives: hedge funds, commodities, gold',
   'Descorrelación de portafolio', 'Portfolio decorrelation'),
  ('a5000000-0000-4000-8000-000000000104', 'a1000000-0000-4000-8000-000000000110', 40, 'D',
   'Real Estate y activos reales', 'Real Estate & real assets',
   'Patrimonio tangible', 'Tangible wealth'),
  ('a5000000-0000-4000-8000-000000000105', 'a1000000-0000-4000-8000-000000000110', 50, 'E',
   'Cripto y activos digitales', 'Crypto & digital assets',
   'Frontera digital', 'Digital frontier'),
  -- Salones del bloque de relacionamiento (Día 2, 10:20)
  ('a5000000-0000-4000-8000-000000000201', 'a1000000-0000-4000-8000-000000000205', 10, '1:1',
   'Reuniones agendadas', 'Scheduled meetings',
   'Inversionistas ↔ gestores', 'Investors ↔ managers'),
  ('a5000000-0000-4000-8000-000000000202', 'a1000000-0000-4000-8000-000000000205', 20, 'Feria',
   'Stands de gestores, fondos y proyectos', 'Manager, fund and project booths',
   'Recorrido libre', 'Open walkthrough'),
  ('a5000000-0000-4000-8000-000000000203', 'a1000000-0000-4000-8000-000000000205', 30, 'Speed',
   'Speed-meetings dirigidos por perfil', 'Profile-targeted speed meetings',
   'Family office ↔ GP · retail ↔ wealth', 'Family office ↔ GP · retail ↔ wealth')
on conflict (id) do nothing;
