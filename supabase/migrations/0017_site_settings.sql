-- =====================================================================
-- LINKU SUMMIT — Migración 0017
-- Ajustes editables desde el admin (tabla clave → JSON).
-- Primer uso: el enlace a la agenda de citas 1:1 del proveedor externo,
-- que se muestra en /me y que un admin puede cambiar sin desplegar.
-- =====================================================================

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by_email text
);

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.handle_updated_at();

alter table public.site_settings enable row level security;

-- Lectura pública: lo que hay aquí se muestra en el sitio (enlaces, textos).
-- No guardar secretos en esta tabla.
drop policy if exists "Public read site_settings" on public.site_settings;
create policy "Public read site_settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins manage site_settings" on public.site_settings;
create policy "Admins manage site_settings"
  on public.site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.site_settings is
  'Ajustes del sitio editables desde /admin/settings. Lectura pública, escritura admin.';

-- Semilla: agenda de citas apagada hasta que un admin ponga el enlace.
insert into public.site_settings (key, value) values (
  'meetings',
  jsonb_build_object(
    'enabled', false,
    'url', '',
    'title_es', 'Agenda tus citas 1:1',
    'title_en', 'Book your 1:1 meetings',
    'desc_es', 'Reuniones de 20 minutos con inversionistas, gestores y founders, coordinadas antes del summit.',
    'desc_en', '20-minute meetings with investors, managers and founders, arranged before the summit.',
    'cta_es', 'Abrir agenda de citas',
    'cta_en', 'Open the meetings scheduler',
    'note_es', 'La agenda se habilita más cerca del evento. Te avisaremos por correo.',
    'note_en', 'The scheduler opens closer to the event. We will email you.'
  )
)
on conflict (key) do nothing;
