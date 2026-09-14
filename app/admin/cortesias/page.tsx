import Link from 'next/link';
import { Gift, Plus, Edit3, CheckCircle2, Clock, Users, Ticket } from 'lucide-react';
import { getCourtesyReport, COURTESY_CATEGORY_LABEL, type CourtesyRow } from '@/lib/coupons';

export const metadata = { title: 'Cortesías · Admin · LINKU CAPITAL SUMMIT 2026' };
export const dynamic = 'force-dynamic';

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

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Entregada', cls: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' },
  pending: { label: 'Pendiente', cls: 'border-amber-500/30 bg-amber-500/15 text-amber-300' },
  failed: { label: 'Fallida', cls: 'border-red-500/30 bg-red-500/15 text-red-300' },
  refunded: { label: 'Reembolsada', cls: 'border-sky-500/30 bg-sky-500/15 text-sky-300' },
  expired: { label: 'Expirada', cls: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300' }
};

/** A quién va la cortesía, en una línea: organización, persona o ambas. */
function grantee(c: CourtesyRow): string {
  const parts = [c.granted_to_org, c.granted_to_name].filter(Boolean);
  if (parts.length === 0) return c.description || '—';
  return parts.join(' · ');
}

export default async function AdminCortesiasPage() {
  const { rows, totals } = await getCourtesyReport();
  const categories = Object.entries(totals.byCategory).sort((a, b) => b[1].used - a[1].used);

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-3xl font-bold tracking-tightish text-linku-text">
            <Gift size={26} className="text-linku-coral" /> Cortesías
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-linku-text-muted">
            Entradas otorgadas sin costo. Cada cortesía es un código que cubre el 100 % y se
            salta la pasarela. Aquí ves cuántas diste, a quién, cuántas ya se usaron y cuántas
            quedan por reclamar.
          </p>
        </div>
        <Link
          href="/admin/coupons/new?kind=cortesia"
          className="inline-flex items-center gap-2 rounded-xl bg-linku-coral px-4 py-2.5 text-sm font-semibold text-white shadow-coral-glow transition hover:bg-linku-coral-soft"
        >
          <Plus size={16} /> Nueva cortesía
        </Link>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Gift} label="Códigos" value={String(totals.codes)} tone="coral" />
        <Stat
          icon={Ticket}
          label="Cupos otorgados"
          value={
            totals.unlimitedCodes > 0
              ? `${totals.capacity} + ∞`
              : String(totals.capacity)
          }
          hint={totals.unlimitedCodes > 0 ? `${totals.unlimitedCodes} código(s) sin tope` : undefined}
          tone="sky"
        />
        <Stat icon={CheckCircle2} label="Ya usadas" value={String(totals.used)} tone="emerald" />
        <Stat
          icon={Clock}
          label="Por reclamar"
          value={String(totals.remaining)}
          hint="de los códigos con tope"
          tone="amber"
        />
      </section>

      {totals.stuckPending > 0 && (
        <p className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Hay {totals.stuckPending} orden(es) con cortesía que quedaron pendientes: son de antes de
          que el checkout saltara la pasarela. Ciérralas desde Ventas marcándolas como pagadas
          con motivo &quot;Cortesía&quot;.
        </p>
      )}

      {categories.length > 0 && (
        <section className="mb-8 flex flex-wrap gap-2">
          {categories.map(([cat, n]) => (
            <span
              key={cat}
              className="inline-flex items-center gap-2 rounded-full border border-linku-border-2 bg-linku-bg-2 px-3 py-1.5 text-xs text-linku-text-muted"
            >
              <span className="font-semibold text-linku-text">
                {COURTESY_CATEGORY_LABEL[cat] ?? cat}
              </span>
              <span className="text-emerald-300">{n.used} usadas</span>
              <span className="text-linku-text-dim">·</span>
              <span className="text-amber-300">{n.remaining} por reclamar</span>
            </span>
          ))}
        </section>
      )}

      <div className="overflow-hidden rounded-2xl border border-linku-border bg-linku-bg-2">
        {rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Gift size={32} className="mx-auto text-linku-text-dim" />
            <p className="mt-3 text-sm text-linku-text-muted">
              Todavía no hay cortesías. Crea la primera.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-linku-bg-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Para quién</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Entrada</th>
                  <th className="px-4 py-3 text-center">Usadas</th>
                  <th className="px-4 py-3 text-center">Por reclamar</th>
                  <th className="px-4 py-3">Otorgada</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <CourtesyRows key={c.id} c={c} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CourtesyRows({ c }: { c: CourtesyRow }) {
  const exhausted = c.remaining === 0;
  const status = !c.active
    ? { label: 'Inactiva', cls: 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300' }
    : exhausted
      ? { label: 'Agotada', cls: 'border-sky-500/30 bg-sky-500/15 text-sky-300' }
      : { label: 'Disponible', cls: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' };

  return (
    <>
      <tr className="border-t border-linku-border transition hover:bg-white/5">
        <td className="px-4 py-3">
          <p className="font-mono font-semibold text-linku-text">{c.code}</p>
          {c.notes && <p className="max-w-[220px] truncate text-[11px] text-linku-text-dim">{c.notes}</p>}
        </td>
        <td className="px-4 py-3">
          <p className="text-linku-text">{grantee(c)}</p>
          {c.granted_to_email && (
            <p className="text-[11px] text-linku-text-dim">{c.granted_to_email}</p>
          )}
        </td>
        <td className="px-4 py-3 text-linku-text-muted">
          {c.courtesy_category ? COURTESY_CATEGORY_LABEL[c.courtesy_category] ?? c.courtesy_category : '—'}
        </td>
        <td className="px-4 py-3 text-linku-text-muted">
          {c.applies_to_tiers && c.applies_to_tiers.length > 0
            ? c.applies_to_tiers.join(', ')
            : <span className="text-linku-text-dim">Cualquiera</span>}
        </td>
        <td className="px-4 py-3 text-center tabular-nums text-emerald-300">
          {c.used}
          {c.max_uses !== null && <span className="text-linku-text-dim"> / {c.max_uses}</span>}
        </td>
        <td className="px-4 py-3 text-center tabular-nums text-amber-300">
          {c.remaining === null ? <span className="text-linku-text-dim">∞</span> : c.remaining}
        </td>
        <td className="px-4 py-3 text-linku-text-muted">
          <p>{fmtDate(c.created_at)}</p>
          {c.granted_by_email && (
            <p className="text-[11px] text-linku-text-dim">{c.granted_by_email}</p>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.cls}`}>
            {status.label}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <Link
            href={`/admin/coupons/${c.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-linku-border-2 px-2.5 py-1.5 text-xs font-medium text-linku-text-muted transition hover:border-white/25 hover:text-linku-text"
          >
            <Edit3 size={12} /> Editar
          </Link>
        </td>
      </tr>

      {c.uses.length > 0 && (
        <tr className="border-t border-linku-border/50 bg-linku-bg-3/40">
          <td colSpan={9} className="px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-linku-text-dim">
              <Users size={11} /> Quién la usó
            </p>
            <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {c.uses.map((u) => {
                const st = ORDER_STATUS[u.order_status] ?? ORDER_STATUS.pending;
                return (
                  <li
                    key={u.order_id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-linku-border-2 bg-linku-bg-2 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-linku-text">{u.buyer_name || '—'}</p>
                      <p className="truncate text-[11px] text-linku-text-dim">
                        {u.buyer_email || 'sin correo'}
                        {u.buyer_company ? ` · ${u.buyer_company}` : ''}
                        {u.buyer_position ? ` · ${u.buyer_position}` : ''}
                      </p>
                      <p className="text-[11px] text-linku-text-dim">
                        {u.ticket_tier} · {fmtDate(u.paid_at ?? u.created_at)}
                        {u.buyer_doc_number ? ` · CC ${u.buyer_doc_number}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                      <Link
                        href={`/admin/orders/${u.order_id}`}
                        className="text-[11px] font-semibold text-linku-coral hover:text-linku-coral-soft"
                      >
                        Ver venta →
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone
}: {
  icon: typeof Gift;
  label: string;
  value: string;
  hint?: string;
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
      <p className="mt-2 text-xl font-bold tracking-tightish text-linku-text">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-linku-text-dim">{hint}</p>}
    </div>
  );
}
