-- =====================================================================
-- LINKU SUMMIT — Migración 0021
-- Actividad paralela de todo el día (ej. rueda de negocios) por día de
-- agenda. Todo opcional: si no hay título, la portada no muestra nada.
--
-- Depende de: 0014 (agenda_days). Las políticas RLS de agenda_days ya
-- existen y cubren las columnas nuevas. Idempotente y no destructiva.
-- =====================================================================

alter table public.agenda_days
  add column if not exists parallel_title_es text,
  add column if not exists parallel_title_en text,
  add column if not exists parallel_desc_es  text,
  add column if not exists parallel_desc_en  text,
  add column if not exists parallel_time_es  text,
  add column if not exists parallel_time_en  text;

comment on column public.agenda_days.parallel_title_es is 'Actividad paralela de todo el día: título (ES). Vacío = no se muestra.';
comment on column public.agenda_days.parallel_title_en is 'Actividad paralela de todo el día: título (EN). Si está vacío se usa el ES.';
comment on column public.agenda_days.parallel_desc_es  is 'Actividad paralela de todo el día: descripción (ES), opcional.';
comment on column public.agenda_days.parallel_desc_en  is 'Actividad paralela de todo el día: descripción (EN), opcional.';
comment on column public.agenda_days.parallel_time_es  is 'Actividad paralela de todo el día: horario libre (ES), ej. "8:00 a. m. – 6:00 p. m." o "Todo el día".';
comment on column public.agenda_days.parallel_time_en  is 'Actividad paralela de todo el día: horario libre (EN), ej. "All day".';
