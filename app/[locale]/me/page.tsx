import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Ticket,
  User,
  Building2,
  Briefcase,
  Mail,
  ArrowRight,
  CalendarClock,
  ExternalLink,
  CheckCircle2,
  type LucideIcon
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { localizePath, type Locale } from '@/lib/i18n/config';
import { getContent } from '@/lib/i18n/content';
import { getMeetingsSettings, meetingsCopy } from '@/lib/settings';
import { claimMyOrders } from '../checkout/actions';
import SignOutButton from './SignOutButton';

export const metadata = {
  title: 'LINKU CAPITAL SUMMIT 2026'
};

function fmtDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleDateString(locale === 'es' ? 'es-CO' : 'en-US', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export default async function MePage(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(localizePath('/login?next=/me', params.locale));
  }

  // Vincula compras hechas como invitado (mismo email) a esta cuenta. Idempotente.
  await claimMyOrders();

  const [{ data: profile }, { data: tickets }, meetings] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('tickets_issued')
      .select('id, qr_code, ticket_tier, status, used_at, created_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    getMeetingsSettings()
  ]);

  // Mapa slug → nombre del tier en el idioma del usuario
  const tierSlugs = Array.from(new Set((tickets ?? []).map((t) => t.ticket_tier)));
  const tierNameBySlug: Record<string, string> = {};
  if (tierSlugs.length > 0) {
    const { data: tierRows } = await supabase
      .from('ticket_tiers')
      .select('slug, name_es, name_en')
      .in('slug', tierSlugs);
    for (const r of tierRows ?? []) {
      tierNameBySlug[r.slug] = params.locale === 'es' ? r.name_es : r.name_en;
    }
  }

  const t = getContent(params.locale).ui.me;
  const displayName = profile?.full_name?.trim() || user.email?.split('@')[0] || '';
  const m = meetingsCopy(meetings.value, params.locale);
  const meetingsOpen = meetings.value.enabled && meetings.value.url.trim() !== '';
  // La agenda de citas es un beneficio de ciertas entradas (por defecto Smart Access).
  const canBookMeetings = (tickets ?? []).some((tk) =>
    meetings.value.tiers.includes(tk.ticket_tier)
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-linku-bg pb-20">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-hero-glow opacity-60"
        aria-hidden
      />

      <header className="relative border-b border-linku-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
          <Link
            href={localizePath('/', params.locale)}
            className="flex items-center gap-3"
            aria-label="Home"
          >
            <Image
              src="/brand/linku-icon.png"
              alt="LinkU"
              width={72}
              height={72}
              className="h-9 w-9"
            />
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tightish text-linku-text">
                LINKU <span className="text-linku-coral">SUMMIT</span>
              </span>
              <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.22em] text-linku-coral/70">
                {t.subtitle}
              </span>
            </span>
          </Link>
          <SignOutButton locale={params.locale} label={t.signOut} />
        </div>
      </header>

      <div className="relative mx-auto max-w-5xl px-5 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
            {t.greeting} {displayName}
          </p>
          <h1 className="text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl">
            {t.title}
          </h1>
        </div>

        {/* CITAS 1:1 — solo para entradas habilitadas; enlace y textos en /admin/settings */}
        {canBookMeetings && (
        <section className="mt-10 linku-card linku-card-coral p-7 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linku-coral/15 text-linku-coral">
                <CalendarClock size={22} strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="text-lg font-bold tracking-tightish text-linku-text">{m.title}</h2>
                <p className="mt-1 max-w-xl text-sm text-linku-text-muted">{m.desc}</p>
                {!meetingsOpen && m.note && (
                  <p className="mt-2 text-xs text-linku-text-dim">{m.note}</p>
                )}
              </div>
            </div>
            {meetingsOpen ? (
              <a
                href={meetings.value.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-linku-coral px-5 py-3 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft"
              >
                {m.cta}
                <ExternalLink size={15} />
              </a>
            ) : (
              <span className="inline-flex shrink-0 items-center justify-center rounded-xl border border-linku-border-2 px-5 py-3 text-sm font-semibold text-linku-text-dim">
                {t.meetingsSoon}
              </span>
            )}
          </div>
          {meetingsOpen && (
            <p className="mt-4 text-[11px] text-linku-text-dim">{t.meetingsExternal}</p>
          )}
        </section>
        )}

        <div
          className={`${canBookMeetings ? 'mt-6' : 'mt-10'} grid gap-6 lg:grid-cols-[1.4fr_1fr]`}
        >
          {/* PERFIL */}
          <section className="linku-card p-7 sm:p-8">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tightish text-linku-text">
                {t.profileTitle}
              </h2>
            </header>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <ProfileField icon={User} label={t.fieldName} value={profile?.full_name || '—'} />
              <ProfileField icon={Mail} label={t.fieldEmail} value={user.email ?? '—'} />
              <ProfileField
                icon={Briefcase}
                label={t.fieldRole}
                value={
                  profile?.role
                    ? (t.roleLabels as Record<string, string>)[profile.role] ?? profile.role
                    : t.roleTBD
                }
              />
              <ProfileField
                icon={Building2}
                label={t.fieldCompany}
                value={profile?.company || '—'}
              />
            </dl>

            <p className="mt-7 rounded-xl border border-linku-border bg-linku-bg-3/60 p-4 text-sm text-linku-text-muted">
              {t.profileNote}
            </p>
          </section>

          {/* ENTRADAS — sin QR: la acreditación en el evento la hace InContacto */}
          <section className="linku-card p-7 sm:p-8">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tightish text-linku-text">
                {t.ticketsTitle}
              </h2>
              {(tickets ?? []).length > 0 && (
                <span className="rounded-full bg-linku-coral/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-linku-coral">
                  {(tickets ?? []).length}
                </span>
              )}
            </header>

            {(tickets ?? []).length > 0 ? (
              <>
                <ul className="mt-6 space-y-4">
                  {(tickets ?? []).map((row) => (
                    <li
                      key={row.id}
                      className="flex items-start justify-between gap-4 rounded-xl border border-linku-border bg-linku-bg-3/50 p-5"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-linku-coral">
                          {tierNameBySlug[row.ticket_tier] ?? row.ticket_tier}
                        </p>
                        <p className="mt-1.5 text-[11px] text-linku-text-dim">
                          {t.ticketsIssued} {fmtDate(row.created_at, params.locale)}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                        <CheckCircle2 size={12} /> {t.ticketsActive}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-xs text-linku-text-dim">{t.ticketsAccreditation}</p>
              </>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-dashed border-linku-border-2 bg-linku-bg-3/30 px-5 py-10 text-center">
                <Ticket size={28} strokeWidth={1.5} className="text-linku-text-dim" />
                <p className="text-sm text-linku-text-muted">{t.ticketsEmpty}</p>
                <Link
                  href={localizePath('/#tickets', params.locale)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-linku-coral hover:text-linku-coral-soft"
                >
                  {t.ticketsView}
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linku-coral/10 text-linku-coral">
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <div className="flex flex-col">
        <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-linku-text-dim">
          {label}
        </dt>
        <dd className="mt-0.5 break-words text-sm font-medium text-linku-text">{value}</dd>
      </div>
    </div>
  );
}
