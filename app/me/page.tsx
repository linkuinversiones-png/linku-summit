import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Ticket, User, Building2, Briefcase, Mail, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

export const metadata = {
  title: 'Mi cuenta · LINKU SUMMIT 2026',
  description: 'Panel personal del LinkU Summit 2026.'
};

const ROLE_LABEL: Record<string, string> = {
  investor: 'Inversionista',
  founder: 'Founder',
  sponsor: 'Sponsor',
  partner: 'Aliado',
  attendee: 'Asistente',
  admin: 'Admin'
};

export default async function MePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/me');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: tickets } = await supabase
    .from('tickets_issued')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const displayName = profile?.full_name?.trim() || user.email?.split('@')[0] || 'Asistente';

  return (
    <main className="relative min-h-screen overflow-hidden bg-linku-bg pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-hero-glow opacity-60" aria-hidden />

      <header className="relative border-b border-linku-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8 sm:py-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Inicio">
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
                Mi cuenta
              </span>
            </span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="relative mx-auto max-w-5xl px-5 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
            Hola, {displayName}
          </p>
          <h1 className="text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl">
            Tu acceso al summit.
          </h1>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* PERFIL */}
          <section className="linku-card p-7 sm:p-8">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tightish text-linku-text">Tu perfil</h2>
              <button
                type="button"
                disabled
                className="text-xs font-medium uppercase tracking-[0.18em] text-linku-text-dim"
                title="Próximamente"
              >
                Editar
              </button>
            </header>

            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <ProfileField icon={User} label="Nombre" value={profile?.full_name || '—'} />
              <ProfileField icon={Mail} label="Email" value={user.email ?? '—'} />
              <ProfileField
                icon={Briefcase}
                label="Rol"
                value={profile?.role ? ROLE_LABEL[profile.role] ?? profile.role : 'Por confirmar'}
              />
              <ProfileField icon={Building2} label="Empresa" value={profile?.company || '—'} />
            </dl>

            <p className="mt-7 rounded-xl border border-linku-border bg-linku-bg-3/60 p-4 text-sm text-linku-text-muted">
              Tu perfil se completa cuando confirmes tu rol antes del summit. Por ahora estos datos son
              suficientes para tu acceso.
            </p>
          </section>

          {/* BOLETAS */}
          <section className="linku-card p-7 sm:p-8">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tightish text-linku-text">Mis boletas</h2>
              {tickets && tickets.length > 0 && (
                <span className="rounded-full bg-linku-coral/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-linku-coral">
                  {tickets.length}
                </span>
              )}
            </header>

            {tickets && tickets.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {tickets.map((t) => (
                  <li key={t.id} className="rounded-xl border border-linku-border bg-linku-bg-3/50 p-4">
                    <p className="text-sm font-semibold text-linku-text">{t.ticket_tier}</p>
                    <p className="mt-1 text-xs text-linku-text-muted">QR: {t.qr_code.slice(0, 8)}…</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-dashed border-linku-border-2 bg-linku-bg-3/30 px-5 py-10 text-center">
                <Ticket size={28} strokeWidth={1.5} className="text-linku-text-dim" />
                <p className="text-sm text-linku-text-muted">
                  Todavía no tienes boletas activas.
                </p>
                <Link
                  href="/#tickets"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-linku-coral hover:text-linku-coral-soft"
                >
                  Ver boletería
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
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
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
