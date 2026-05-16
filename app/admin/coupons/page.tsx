import Link from 'next/link';
import { Plus, TicketPercent, Edit3 } from 'lucide-react';
import { getAllCouponsAdmin } from '@/lib/coupons';
import { formatCop } from '@/lib/tickets';
import RowActions from './RowActions';

export const metadata = { title: 'Cupones · Admin · LINKU SUMMIT' };
export const dynamic = 'force-dynamic';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export default async function AdminCouponsPage() {
  const coupons = await getAllCouponsAdmin();

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tightish text-linku-text">
            Cupones
          </h1>
          <p className="mt-1 text-sm text-linku-text-muted">
            Códigos de descuento. Cada uso queda registrado para auditoría.
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-4 py-2.5 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft"
        >
          <Plus size={16} /> Nuevo cupón
        </Link>
      </header>

      <div className="overflow-hidden rounded-2xl border border-linku-border bg-linku-bg-2">
        {coupons.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <TicketPercent size={32} className="mx-auto text-linku-text-dim" />
            <p className="mt-3 text-sm text-linku-text-muted">
              Aún no hay cupones. Crea el primero.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-linku-bg-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Descuento</th>
                <th className="px-4 py-3">Usos</th>
                <th className="px-4 py-3">Expira</th>
                <th className="px-4 py-3">Tiers</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-linku-border transition hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-linku-text">{c.code}</p>
                    {c.description && (
                      <p className="text-[11px] text-linku-text-dim">{c.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-linku-text-muted">
                    {c.discount_type === 'percent'
                      ? `${c.discount_value}%`
                      : formatCop(c.discount_value)}
                  </td>
                  <td className="px-4 py-3 text-linku-text-muted tabular-nums">
                    {c.current_uses}
                    {c.max_uses !== null && (
                      <span className="text-linku-text-dim"> / {c.max_uses}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-linku-text-muted">
                    {fmtDate(c.expires_at)}
                  </td>
                  <td className="px-4 py-3 text-linku-text-muted">
                    {c.applies_to_tiers && c.applies_to_tiers.length > 0
                      ? c.applies_to_tiers.join(', ')
                      : <span className="text-linku-text-dim">Todos</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        c.active
                          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                          : 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300'
                      }`}
                    >
                      {c.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/coupons/${c.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-linku-border-2 px-2.5 py-1.5 text-xs font-medium text-linku-text-muted transition hover:border-white/25 hover:text-linku-text"
                      >
                        <Edit3 size={12} /> Editar
                      </Link>
                      <RowActions id={c.id} active={c.active} />
                    </div>
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
