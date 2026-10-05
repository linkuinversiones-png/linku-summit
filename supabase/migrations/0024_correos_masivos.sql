-- =====================================================================
-- LINKU SUMMIT — Migración 0024
-- Correos masivos a asistentes (admin /admin/emails, envío vía Resend).
-- Crea: email_campaigns (la campaña) y email_campaign_recipients (un
-- registro por destinatario, con su estado de envío).
-- Idempotente y no destructiva: solo crea tablas, índices y políticas.
-- Solo admins (public.is_admin()) pueden leer, crear y actualizar; no hay
-- acceso público ni política de borrado.
-- =====================================================================

create table if not exists public.email_campaigns (
  id               uuid primary key default gen_random_uuid(),
  subject          text not null,
  title            text,                          -- título (H1) del correo; null = se usa el asunto
  body             text not null,                 -- texto plano escrito por el admin
  cta_label        text,
  cta_url          text,
  reply_to         text not null,
  audience         jsonb not null default '{}'::jsonb,  -- { "tiers": ["slug", ...] }
  status           text not null default 'draft'
                   check (status in ('draft','sending','sent','partial')),
  total_recipients integer not null default 0,
  sent_count       integer not null default 0,
  failed_count     integer not null default 0,
  created_by       uuid references auth.users(id) on delete set null,
  created_by_email text,
  created_at       timestamptz not null default now(),
  sent_at          timestamptz
);

create index if not exists email_campaigns_created_at_idx
  on public.email_campaigns(created_at desc);

create table if not exists public.email_campaign_recipients (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns(id) on delete cascade,
  email       text not null,                      -- siempre en minúsculas
  name        text,
  status      text not null default 'queued'
              check (status in ('queued','sending','sent','failed')),
  resend_id   text,
  error       text,
  claimed_at  timestamptz,                        -- cuándo pasó a 'sending' (detecta cortes)
  sent_at     timestamptz,
  unique (campaign_id, email)
);

create index if not exists email_campaign_recipients_status_idx
  on public.email_campaign_recipients(campaign_id, status);

alter table public.email_campaigns enable row level security;
alter table public.email_campaign_recipients enable row level security;

drop policy if exists "Admins select email_campaigns" on public.email_campaigns;
create policy "Admins select email_campaigns"
  on public.email_campaigns for select using (public.is_admin());

drop policy if exists "Admins insert email_campaigns" on public.email_campaigns;
create policy "Admins insert email_campaigns"
  on public.email_campaigns for insert with check (public.is_admin());

drop policy if exists "Admins update email_campaigns" on public.email_campaigns;
create policy "Admins update email_campaigns"
  on public.email_campaigns for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins select email_campaign_recipients" on public.email_campaign_recipients;
create policy "Admins select email_campaign_recipients"
  on public.email_campaign_recipients for select using (public.is_admin());

drop policy if exists "Admins insert email_campaign_recipients" on public.email_campaign_recipients;
create policy "Admins insert email_campaign_recipients"
  on public.email_campaign_recipients for insert with check (public.is_admin());

drop policy if exists "Admins update email_campaign_recipients" on public.email_campaign_recipients;
create policy "Admins update email_campaign_recipients"
  on public.email_campaign_recipients for update
  using (public.is_admin()) with check (public.is_admin());

-- Por si la tabla ya existía sin la columna del título.
alter table public.email_campaigns add column if not exists title text;
