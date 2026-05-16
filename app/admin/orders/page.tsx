import Link from 'next/link';
import { formatCop } from '@/lib/tickets';
import {
  listOrdersEnriched,
  getOrdersStats,
  type OrderRow
} from '@/lib/admin/orders';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  Users,
  TrendingUp,
  Search
} from 'lucide-react';

export const metadata = { title: 'Ventas · Admin · LINKU SUMMIT' };
export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<OrderRow['status'], string> = {
  paid: 'Pagada',
  pending: 'Pendiente',
  failed: 'Fallida',
  refunded: 'Reembolsada',
  expired: 'Expirada'
};

const STATUS_BADGE: Record<OrderRow['status'], string> = {
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  failed: 'bg-red-500/15 text-red-300 border-red-500/30',
  refunded: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  expired: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30'
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

type Search = {
  status?: OrderRow['status'];
  tier?: string;
  q?: string;
};

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Search;
}) {
  const [orders, stats] = await Promise.all([
    listOrdersEnriched({
      status: searchParams.status,
      tierSlug: searchParams.tier,
      search: searchParams.q
    }),
    getOrdersStats()
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tightish text-linku-text">
          Ventas
        </h1>
        <p className="mt-1 text-sm text-linku-text-muted">
          Todas las órdenes registradas. Cada compra que entra al sistema queda
          aquí, sin importar si el pago se confirmó o no.
        </p>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={CheckCircle2}
          label="Pagadas"
          value={String(stats.totalPaidCount)}
          tone="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Ingresos"
          value={formatCop(stats.totalPaidCop)}
          tone="coral"
        />
        <StatCard
          icon={Users}
          label="Asistentes únicos"
          value={String(stats.uniqueAttendees)}
          tone="sky"
        />
        <StatCard
          icon={Clock}
          label="Pendientes"
          value={String(stats.totalPendingCount)}
          tone="amber"
        />
      </section>

      <form
        method="GET"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-linku-border-2 bg-linku-bg-2 p-4"
      >
        <label className="flex flex-1 min-w-[200px] flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
            Buscar
          </span>
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-linku-text-dim"
            />
            <input
              type="search"
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="Email, nombre o referencia"
              className="w-full rounded-lg border border-linku-border-2 bg-linku-bg-3 pl-9 pr-3 py-2 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
            Estado
          </span>
          <select
            name="status"
            defaultValue={searchParams.status ?? ''}
            className="rounded-lg border border-linku-border-2 bg-linku-bg-3 px-3 py-2 text-sm text-linku-text focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
          >
            <option value="">Todos</option>
            <option value="paid">Pagadas</option>
            <option value="pending">Pendientes</option>
            <option value="failed">Fallidas</option>
            <option value="refunded">Reembolsadas</option>
            <option value="expired">Expiradas</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-linku-text-muted">
            Tier
          </span>
          <input
            type="text"
            name="tier"
            defaultValue={searchParams.tier ?? ''}
            placeholder="slug del tier"
            className="rounded-lg border border-linku-border-2 bg-linku-bg-3 px-3 py-2 text-sm text-linku-text placeholder:text-linku-text-dim focus:border-linku-coral/50 focus:outline-none focus:ring-2 focus:ring-linku-coral/30"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-linku-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-linku-coral-soft"
        >
          Filtrar
        </button>
        {(searchParams.q || searchParams.status || searchParams.tier) && (
          <Link
            href="/admin/orders"
            className="rounded-lg border border-linku-border-2 px-4 py-2 text-sm font-medium text-linku-text-muted transition hover:border-white/25 hover:text-linku-text"
          >
            Limpiar
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-2xl border border-linku-border bg-linku-bg-2">
        {orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Receipt size={32} className="mx-auto text-linku-text-dim" />
            <p className="mt-3 text-sm text-linku-text-muted">
              Aún no hay ventas que coincidan con el filtro.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-linku-bg-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Comprador</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Boleta</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-linku-border transition hover:bg-white/5"
                >
                  <td className="px-4 py-3 text-linku-text-muted">
                    {fmtDate(o.paid_at ?? o.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-linku-text">{o.user_full_name || '—'}</p>
                    <p className="text-xs text-linku-text-dim">{o.user_email || o.user_id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 text-linku-text-muted">
                    {o.tier_name}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-linku-text">
                    {formatCop(o.total_cop)}
                    {o.discount_cop > 0 && (
                      <p className="mt-0.5 text-[10px] font-normal text-linku-text-dim">
                        cupón {o.coupon_code ?? ''} −{formatCop(o.discount_cop)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[o.status]}`}
                    >
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-linku-text-muted">
                    {o.ticket ? (
                      o.ticket.used_at ? (
                        <span className="inline-flex items-center gap-1 text-xs text-sky-300">
                          <CheckCircle2 size={12} /> Usada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                          <CheckCircle2 size={12} /> Activa
                        </span>
                      )
                    ) : o.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                        <XCircle size={12} /> Sin emitir
                      </span>
                    ) : (
                      <span className="text-xs text-linku-text-dim">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-xs font-semibold text-linku-coral hover:text-linku-coral-soft"
                    >
                      Detalle →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  tone: 'emerald' | 'coral' | 'sky' | 'amber';
}) {
  const toneClass: Record<typeof tone, string> = {
    emerald: 'text-emerald-300',
    coral: 'text-linku-coral',
    sky: 'text-sky-300',
    amber: 'text-amber-300'
  };
  return (
    <div className="rounded-2xl border border-linku-border-2 bg-linku-bg-2 p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
        <Icon size={12} className={toneClass[tone]} />
        {label}
      </div>
      <p className="mt-2 text-xl font-bold tracking-tightish text-linku-text">
        {value}
      </p>
    </div>
  );
}
