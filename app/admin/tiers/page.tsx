import Link from 'next/link';
import { Plus, Pencil, Eye, EyeOff } from 'lucide-react';
import { getAllTiersAdmin, formatCop } from '@/lib/tickets';
import RowActions from './RowActions';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Entradas · LINKU Admin',
  robots: { index: false, follow: false }
};

export default async function AdminTiersPage() {
  const tiers = await getAllTiersAdmin();

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-linku-coral">
            Entradas
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tightish text-linku-text sm:text-4xl">
            Catálogo de tiers.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-linku-text-muted">
            Define cuántos tipos de entrada hay, sus precios y beneficios. Los
            tiers activos aparecen en la landing. Cambios se reflejan en
            segundos (revalidate).
          </p>
        </div>
        <Link
          href="/admin/tiers/new"
          className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-5 py-2.5 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft"
        >
          <Plus size={16} /> Nuevo tier
        </Link>
      </header>

      {tiers.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-linku-border-2 bg-linku-bg-3/30 px-6 py-16 text-center">
          <p className="text-base font-medium text-linku-text">
            Aún no hay tiers.
          </p>
          <p className="mt-2 text-sm text-linku-text-muted">
            Crea el primero para que aparezca en la landing.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-linku-border bg-linku-bg-2">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-linku-border bg-linku-bg-3/40 text-xs uppercase tracking-wider text-linku-text-dim">
              <tr>
                <th className="px-4 py-3 font-semibold">Tier</th>
                <th className="px-4 py-3 font-semibold">Precio</th>
                <th className="px-4 py-3 font-semibold">Cupo</th>
                <th className="px-4 py-3 font-semibold">Orden</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linku-border">
              {tiers.map((t) => (
                <tr key={t.id} className="transition hover:bg-white/[0.02]">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-linku-text">
                        {t.name_es}
                      </span>
                      <span className="text-xs text-linku-text-muted">
                        {t.name_en}
                      </span>
                      <span className="mt-1 inline-flex w-fit rounded-md border border-linku-border bg-linku-bg-3 px-1.5 py-0.5 text-[10px] font-mono text-linku-text-dim">
                        {t.slug}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-semibold tabular-nums text-linku-text">
                    {formatCop(t.price_cop)}
                  </td>
                  <td className="px-4 py-4 tabular-nums text-linku-text-muted">
                    {t.max_quantity == null
                      ? `${t.sold_count} / ∞`
                      : `${t.sold_count} / ${t.max_quantity}`}
                  </td>
                  <td className="px-4 py-4 tabular-nums text-linku-text-muted">
                    {t.sort_order}
                  </td>
                  <td className="px-4 py-4">
                    {t.active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                        <Eye size={11} /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-linku-bg-3 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-linku-text-dim">
                        <EyeOff size={11} /> Oculto
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/tiers/${t.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-linku-border-2 px-2.5 py-1.5 text-xs font-medium text-linku-text-muted transition hover:border-white/25 hover:text-linku-text"
                      >
                        <Pencil size={12} /> Editar
                      </Link>
                      <RowActions id={t.id} active={t.active} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
