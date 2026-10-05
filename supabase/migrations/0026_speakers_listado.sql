-- Speakers: permitir publicar a un speaker solo en la agenda.
-- Idempotente y no destructiva. No toca RLS (la agenda sigue leyendo solo
-- speakers con active = true).
alter table public.speakers
  add column if not exists listed boolean not null default true;

comment on column public.speakers.listed is
  'Si es false, el speaker está publicado (activo) pero no aparece en la sección Speakers de la portada; sí en la agenda donde se vincule';
