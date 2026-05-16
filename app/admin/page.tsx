import { createClient } from '@/lib/supabase/server';
import { Ticket, Users, DollarSign, ScanLine, type LucideIcon } from 'lucide-react';

async function getStats() {
  const supabase = createClient();
  const [
    { count: usersCount },
    { count: ordersPaidCount },
    { count: ticketsCount },
    { data: revenueRows }
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'paid'),
    supabase
      .from('tickets_issued')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('orders')
      .select('total_cop')
      .eq('status', 'paid')
  ]);

  const revenue =
    revenueRows?.reduce((acc, r) => acc + (Number(r.total_cop) || 0), 0) ?? 0;

  return {
    users: usersCount ?? 0,
    paidOrders: ordersPaidCount ?? 0,
    activeTickets: ticketsCount ?? 0,
    revenueCop: revenue
  };
}

function formatCop(value: number) {
  return value.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    sub?: string;
  }> = [
    {
      label: 'Usuarios registrados',
      value: stats.users.toLocaleString('es-CO'),
      icon: Users,
      sub: 'Cuentas creadas en la plataforma'
    },
    {
      label: 'Boletas activas',
      value: stats.activeTickets.toLocaleString('es-CO'),
      icon: Ticket,
      sub: 'Emitidas, no usadas'
    },
    {
      label: 'Órdenes pagadas',
      value: stats.paidOrders.toLocaleString('es-CO'),
      icon: ScanLine,
      sub: 'Total histórico'
    },
    {
      label: 'Recaudo total',
      value: formatCop(stats.revenueCop),
      icon: DollarSign,
      sub: 'Suma de órdenes pagadas'
    }
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl">
          Resumen del summit.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-linku-text-muted sm:text-base">
          Vista rápida de la operación. Los módulos detallados (entradas,
          portería, citas, correos) se irán activando por fases.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <article
              key={c.label}
              className="linku-card flex flex-col gap-4 p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-linku-coral/10 text-linku-coral">
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-2xl font-bold tracking-tightish text-linku-text sm:text-3xl">
                  {c.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-linku-text-dim">
                  {c.label}
                </p>
                {c.sub && (
                  <p className="mt-2 text-xs text-linku-text-muted">{c.sub}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <section className="linku-card p-7">
          <h2 className="text-lg font-bold tracking-tightish text-linku-text">
            Próximas fases
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-linku-text-muted">
            <li className="flex gap-2">
              <span className="text-linku-coral">·</span>
              <span>
                <strong className="text-linku-text">Entradas administrables</strong> — CRUD de tiers con cupos y precios.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-linku-coral">·</span>
              <span>
                <strong className="text-linku-text">ePayco + QR</strong> — checkout y boletas emitidas automáticamente.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-linku-coral">·</span>
              <span>
                <strong className="text-linku-text">Portería</strong> — escaneo de QR desde móvil.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-linku-coral">·</span>
              <span>
                <strong className="text-linku-text">Citas 1:1</strong> — matchmaking con sync a Google y Outlook.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-linku-coral">·</span>
              <span>
                <strong className="text-linku-text">Agente IA</strong> — concierge en la landing.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-linku-coral">·</span>
              <span>
                <strong className="text-linku-text">Correos masivos</strong> — plantillas y segmentos via Resend.
              </span>
            </li>
          </ul>
        </section>

        <section className="linku-card p-7">
          <h2 className="text-lg font-bold tracking-tightish text-linku-text">
            Seguridad
          </h2>
          <p className="mt-3 text-sm text-linku-text-muted">
            Esta zona es solo para perfiles con rol{' '}
            <code className="rounded bg-linku-bg-3 px-1.5 py-0.5 text-xs text-linku-coral">
              admin
            </code>{' '}
            en la tabla{' '}
            <code className="rounded bg-linku-bg-3 px-1.5 py-0.5 text-xs text-linku-coral">
              profiles
            </code>
            . Las consultas se hacen via Supabase con RLS habilitado.
          </p>
          <p className="mt-3 text-sm text-linku-text-muted">
            Recuerda promover los usuarios admin desde el Dashboard de
            Supabase con un{' '}
            <code className="rounded bg-linku-bg-3 px-1.5 py-0.5 text-xs text-linku-coral">
              UPDATE
            </code>{' '}
            en{' '}
            <code className="rounded bg-linku-bg-3 px-1.5 py-0.5 text-xs text-linku-coral">
              public.profiles
            </code>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
